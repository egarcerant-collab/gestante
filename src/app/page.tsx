"use client";

import { useState, useEffect, useRef } from 'react';
import * as XLSX from "xlsx";
import { saveAs } from 'file-saver';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcularNumeradorGinecologia, calcularDenominadorGinecologia } from '@/lib/kpi-helpers';
import { generarInformePDF } from '@/lib/informe-riesgo-pdf';
import type { InformeDatos, PdfImages } from '@/lib/informe-riesgo-pdf';
import JSZip from 'jszip';
import type { KpiResults } from '@/lib/types';
import { MonthlyKpiChart } from '@/components/charts/MonthlyKpiChart';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import html2canvas from 'html2canvas';

const availableFiles = {
  "2026": {
    "ENERO": "/BASES/2026/ENERO/enero.xlsx",
    "FEBRERO": "/BASES/2026/FEBRERO/febrero.xlsx",
  },
};

const monthNameToNumber: { [key: string]: number } = {
    "ENERO": 0, "FEBRERO": 1, "MARZO": 2, "ABRIL": 3, "MAYO": 4, "JUNIO": 5,
    "JULIO": 6, "AGOSTO": 7, "SEPTIEMBRE": 8, "OCTUBRE": 9, "NOVIEMBRE": 10, "DICIEMBRE": 11
};

type ChartDataItem = {
  name: string;
  [key: string]: number | string;
};

// Function to convert Excel serial date to JS Date
const excelSerialDateToJSDate = (serial: number) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    const fractional_day = serial - Math.floor(serial) + 0.0000001;

    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;

    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;
    
    // Create date in UTC to avoid timezone issues
    return new Date(Date.UTC(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate(), hours, minutes, seconds));
};


export default function KpiPage() {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);

  const [kpiResult, setKpiResult] = useState<number | null>(null);
  const [gestantesControlResult, setGestantesControlResult] = useState<number | null>(null);
  const [controlPercentageResult, setControlPercentageResult] = useState<number | null>(null);
  const [examenesVihCompletosResult, setExamenesVihCompletosResult] = useState<number | null>(null);
  const [resultadoTamizajeVihResult, setResultadoTamizajeVihResult] = useState<number | null>(null);
  const [examenesSifilisCompletosResult, setExamenesSifilisCompletosResult] = useState<number | null>(null);
  const [resultadoTamizajeSifilisResult, setResultadoTamizajeSifilisResult] = useState<number | null>(null);
  const [toxoplasmaValidosResult, setToxoplasmaValidosResult] = useState<number | null>(null);
  const [resultadoToxoplasmaResult, setResultadoToxoplasmaResult] = useState<number | null>(null);
  const [examenesHbCompletosResult, setExamenesHbCompletosResult] = useState<number | null>(null);
  const [resultadoTamizajeHbResult, setResultadoTamizajeHbResult] = useState<number | null>(null);
  const [chagasResultadosValidosResult, setChagasResultadosValidosResult] = useState<number | null>(null);
  const [resultadoChagasResult, setResultadoChagasResult] = useState<number | null>(null);
  const [ecografiasValidasResult, setEcografiasValidasResult] = useState<number | null>(null);
  const [resultadoEcografiasResult, setResultadoEcografiasResult] = useState<number | null>(null);
  const [nutricionResult, setNutricionResult] = useState<number | null>(null);
  const [resultadoNutricionResult, setResultadoNutricionResult] = useState<number | null>(null);
  const [odontologiaResult, setOdontologiaResult] = useState<number | null>(null);
  const [resultadoOdontologiaResult, setResultadoOdontologiaResult] = useState<number | null>(null);
  const [ginecologiaResult, setGinecologiaResult] = useState<number | null>(null);
  const [denominadorGinecologiaResult, setDenominadorGinecologiaResult] = useState<number | null>(null);
  const [porcentajeGinecologiaResult, setPorcentajeGinecologiaResult] = useState<number | null>(null);
  const [controlesEnMes, setControlesEnMes] = useState<number | null>(null);
  const [controlesFueraMes, setControlesFueraMes] = useState<number | null>(null);

  const [departments, setDepartments] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [ipsList, setIpsList] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [selectedIps, setSelectedIps] = useState<string>("");
  
  const [allData, setAllData] = useState<any[]>([]);
  const [filterData, setFilterData] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (hasCalculated) {
      calculateKpi();
    }
  }, [selectedDepartment, selectedMunicipality, selectedIps]);

  const cleanHeader = (h: string) =>
    String(h || "")
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  const calculateKpi = async (isInitialRun = false) => {
    if (!selectedFile) {
      setError("Por favor, selecciona un archivo para analizar.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setKpiResult(null);
    setGestantesControlResult(null);
    setControlPercentageResult(null);
    setExamenesVihCompletosResult(null);
    setResultadoTamizajeVihResult(null);
    setExamenesSifilisCompletosResult(null);
    setResultadoTamizajeSifilisResult(null);
    setToxoplasmaValidosResult(null);
    setResultadoToxoplasmaResult(null);
    setExamenesHbCompletosResult(null);
    setResultadoTamizajeHbResult(null);
    setChagasResultadosValidosResult(null);
    setResultadoChagasResult(null);
    setEcografiasValidasResult(null);
    setResultadoEcografiasResult(null);
    setNutricionResult(null);
    setResultadoNutricionResult(null);
    setOdontologiaResult(null);
    setResultadoOdontologiaResult(null);
    setGinecologiaResult(null);
    setDenominadorGinecologiaResult(null);
    setPorcentajeGinecologiaResult(null);
    setControlesEnMes(null);
    setControlesFueraMes(null);

    if (isInitialRun) {
      setHasCalculated(false);
    }

    try {
      let jsonData: any[] = allData;

      if (isInitialRun || allData.length === 0 || allData[0]?.__sourcePath !== selectedFile) {
        const response = await fetch(selectedFile);
        if (!response.ok) {
          throw new Error(`No se pudo encontrar el archivo en la ruta especificada. Status: ${response.status}`);
        }
        let workbook;
        if (selectedFile.endsWith('.csv')) {
          const text = await response.text();
          workbook = XLSX.read(text, { type: 'string' });
        } else {
          const data = await response.arrayBuffer();
          workbook = XLSX.read(data, { type: 'array' });
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: 'dd/mm/yyyy',
        });
        jsonData.forEach(row => row.__sourcePath = selectedFile);
        setAllData(jsonData);
      }
      
      if (jsonData.length === 0) {
        setError("El archivo está vacío o no tiene el formato correcto.");
        setIsLoading(false);
        return;
      }
      
      const pickHeader = (rowObj: Record<string, any>, includes: string[]) => {
        const keys = Object.keys(rowObj);
        return keys.find(k => includes.every(frag => k.includes(frag))) || "";
      };

      const firstClean: any = {};
      const originalHeaders: Record<string, string> = {};
      for (const k in jsonData[0]) {
        const cleanedK = cleanHeader(k);
        firstClean[cleanedK] = jsonData[0][k];
        originalHeaders[cleanedK] = k;
      }
      
      const departmentHeaderRaw = originalHeaders[pickHeader(firstClean, ["departamento_residencia"])];
      const municipalityHeaderRaw = originalHeaders[pickHeader(firstClean, ["municipio_de_residencia"])];
      const ipsHeaderRaw = originalHeaders[pickHeader(firstClean, ["nombre", "ips", "primaria"])];


      if (isInitialRun) {
        const filters: {depts: Set<string>, munis: Set<string>, ips: Set<string>} = {
            depts: new Set(),
            munis: new Set(),
            ips: new Set(),
        };

        const filterRelation: any[] = [];
        
        jsonData.forEach(row => {
          const dept = String(row[departmentHeaderRaw] || '').trim().replace(/\s+/g, ' ').toUpperCase();
          const muni = String(row[municipalityHeaderRaw] || '').trim().replace(/\s+/g, ' ').toUpperCase();
          const ips = String(row[ipsHeaderRaw] || '').trim().replace(/\s+/g, ' ').toUpperCase();
          if (dept) filters.depts.add(dept);
          if (muni) filters.munis.add(muni);
          if (ips) filters.ips.add(ips);
          
          if(dept && muni && ips) {
              filterRelation.push({ dept, muni, ips });
          }
        });
        
        setDepartments(Array.from(filters.depts).sort());
        setMunicipalities(Array.from(filters.munis).sort());
        setIpsList(Array.from(filters.ips).sort());
        setFilterData(filterRelation);
      }
      
      const filteredData = jsonData.filter(row => {
          const rowDept = String(row[departmentHeaderRaw] || '').trim().replace(/\s+/g, ' ').toUpperCase();
          const rowMuni = String(row[municipalityHeaderRaw] || '').trim().replace(/\s+/g, ' ').toUpperCase();
          const rowIps = String(row[ipsHeaderRaw] || '').trim().replace(/\s+/g, ' ').toUpperCase();
          
          const deptMatch = !selectedDepartment || rowDept === selectedDepartment;
          const muniMatch = !selectedMunicipality || rowMuni === selectedMunicipality;
          const ipsMatch = !selectedIps || rowIps === selectedIps;

          return deptMatch && muniMatch && ipsMatch;
      });

      const controlHeader = pickHeader(firstClean, ["identificacion"]);
      const captacionHeader = pickHeader(firstClean, ["edad", "gest", "inicio", "control"]);
      const vih1Header = pickHeader(firstClean, ["vih", "primer", "tamiz"]);
      const vih2Header = pickHeader(firstClean, ["vih", "segundo", "tamiz"]);
      const vih3Header = pickHeader(firstClean, ["vih", "tercer", "tamiz"]);
      const sifilis1Header = pickHeader(firstClean, ["sifilis", "primera"]);
      const sifilis2Header = pickHeader(firstClean, ["sifilis", "segunda"]);
      const sifilis3Header = pickHeader(firstClean, ["sifilis", "tercera"]);
      const toxoplasmaHeader = pickHeader(firstClean, ["toxoplasma", "resultado"]);
      const hbResultadoHeader = pickHeader(firstClean, ["hepatitis", "b", "resultado"]);
      const hbFechaHeader = pickHeader(firstClean, ["hepatitis", "b", "fecha"]);
      const chagasHeader = pickHeader(firstClean, ["chagas", "resultado"]);
      const eco1Header = pickHeader(firstClean, ["ecografia", "translucencia"]);
      const eco2Header = pickHeader(firstClean, ["ecografia", "anomalias"]);
      const eco3Header = pickHeader(firstClean, ["ecografia", "otras"]);
      const nutricionHeader = pickHeader(firstClean, ["nutricion"]);
      const odontologiaHeader = pickHeader(firstClean, ["odontolog", "fecha"]) || pickHeader(firstClean, ["odontolog"]);
      const ultimoControlHeader = pickHeader(firstClean, ["ultimo", "control", "prenatal"]);
      const controlFechaHeaders = [
        'fecha_1er_control', 'fecha_2do_control', 'fecha_3er_control',
        'fecha_4to_control', 'fecha_5to_control', 'fecha_6to_control',
        'fecha_7mo_control', 'fecha_8vo_control', 'fecha_9no_control'
      ].map(frag => pickHeader(firstClean, [frag])).filter(h => h !== '');
      
      let captacionCount = 0;
      let controlCount = 0;
      let sinDatosVihCount = 0;
      let sinDatosSifilisCount = 0;
      let sinDatosToxoplasmaCount = 0;
      let sinDatosHbCount = 0;
      let sinDatosChagasCount = 0;
      let sinDatosEcografiaCount = 0;
      let sinDatosNutricionCount = 0;
      let sinDatosOdontologiaCount = 0;
      let inPeriodCount = 0;
      let outOfPeriodCount = 0;
      const totalRegistros = filteredData.length;

      const numeradorGinecologia = calcularNumeradorGinecologia(filteredData);
      setGinecologiaResult(numeradorGinecologia);

      const denominadorGinecologia = calcularDenominadorGinecologia(filteredData);
      setDenominadorGinecologiaResult(denominadorGinecologia);

      if (denominadorGinecologia > 0) {
        setPorcentajeGinecologiaResult((numeradorGinecologia / denominadorGinecologia) * 100);
      } else {
        setPorcentajeGinecologiaResult(0);
      }

      const selectedMonthName = selectedMonth.toUpperCase().trim() || '';
      const selectedMonthNumber = monthNameToNumber[selectedMonthName];
      const yearFromPath = selectedFile.match(/\/(\d{4})\//)?.[1];
      const yearNumber = yearFromPath ? parseInt(yearFromPath, 10) : parseInt(selectedYear || "0", 10);

      if (!yearNumber || isNaN(yearNumber)) {
        setError("No se pudo determinar el año. Selecciona un año en la interfaz.");
        setIsLoading(false);
        return;
      }

      filteredData.forEach((row: any) => {
        const cleanedRow: { [key: string]: any } = {};
        for (const key in row) {
            cleanedRow[cleanHeader(key)] = row[key];
        }

        const controlValue = cleanedRow[controlHeader];
        if (controlValue !== undefined && controlValue !== "") {
            controlCount++;
        }
        
        const captacionValue = cleanedRow[captacionHeader];
        if (captacionValue !== undefined && captacionValue !== "" && !isNaN(parseFloat(captacionValue)) && parseFloat(captacionValue) < 10) {
          captacionCount++;
        }

        const sd = (v: string) => v.trim() === '' || v.includes("sin datos") || v.includes("sin dato");

        const vih1Value = String(cleanedRow[vih1Header] || '').toLowerCase();
        const vih2Value = String(cleanedRow[vih2Header] || '').toLowerCase();
        const vih3Value = String(cleanedRow[vih3Header] || '').toLowerCase();
        if (sd(vih1Value) && sd(vih2Value) && sd(vih3Value)) {
          sinDatosVihCount++;
        }

        const sif1Value = String(cleanedRow[sifilis1Header] || '').toLowerCase().trim();
        const sif2Value = String(cleanedRow[sifilis2Header] || '').toLowerCase().trim();
        const sif3Value = String(cleanedRow[sifilis3Header] || '').toLowerCase().trim();
        if (sd(sif1Value) && sd(sif2Value) && sd(sif3Value)) {
            sinDatosSifilisCount++;
        }

        const toxoplasmaValue = String(cleanedRow[toxoplasmaHeader] || '').toLowerCase().trim();
        if (sd(toxoplasmaValue)) {
            sinDatosToxoplasmaCount++;
        }

        const hbResultadoValue = String(cleanedRow[hbResultadoHeader] || '').toLowerCase().trim();
        const hbFechaValue = cleanedRow[hbFechaHeader];
        if (sd(hbResultadoValue) && !(hbFechaValue === undefined || hbFechaValue === "")) {
            sinDatosHbCount++;
        }

        const chagasValue = String(cleanedRow[chagasHeader] || '').toLowerCase().trim();
        if (sd(chagasValue)) {
            sinDatosChagasCount++;
        }

        const eco1Value = String(cleanedRow[eco1Header] || '').toLowerCase().trim();
        const eco2Value = String(cleanedRow[eco2Header] || '').toLowerCase().trim();
        const eco3Value = String(cleanedRow[eco3Header] || '').toLowerCase().trim();
        if (sd(eco1Value) && sd(eco2Value) && sd(eco3Value)) {
            sinDatosEcografiaCount++;
        }

        const nutricionValue = String(cleanedRow[nutricionHeader] || '').toLowerCase().trim();
        if (sd(nutricionValue)) {
            sinDatosNutricionCount++;
        }

        const odontologiaValue = String(cleanedRow[odontologiaHeader] || '').toLowerCase().trim();
        if (sd(odontologiaValue)) {
            sinDatosOdontologiaCount++;
        }

        let ultimoControlValue = cleanedRow[ultimoControlHeader];
        if (!ultimoControlValue && controlFechaHeaders.length > 0) {
          for (let i = controlFechaHeaders.length - 1; i >= 0; i--) {
            const v = cleanedRow[controlFechaHeaders[i]];
            if (v !== undefined && v !== '') { ultimoControlValue = v; break; }
          }
        }
        if (ultimoControlValue) {
            let date: Date | null = null;
            if (typeof ultimoControlValue === 'number') {
                date = excelSerialDateToJSDate(ultimoControlValue);
            } else if (typeof ultimoControlValue === 'string') {
                const numVal = parseFloat(ultimoControlValue);
                if (!isNaN(numVal) && !ultimoControlValue.includes('/')) {
                    date = excelSerialDateToJSDate(numVal);
                } else {
                    const parts = ultimoControlValue.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1;
                        const year = parseInt(parts[2], 10);
                        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                             date = new Date(Date.UTC(year, month, day));
                        }
                    }
                }
            }
            
            if (date instanceof Date && !isNaN(date.getTime())) {
                if (date.getUTCFullYear() === yearNumber && date.getUTCMonth() === selectedMonthNumber) {
                    inPeriodCount++;
                } else {
                    outOfPeriodCount++;
                }
            }
        }
      });
      
      setKpiResult(captacionCount);
      setGestantesControlResult(controlCount);
      
      const examenesVihCompletos = totalRegistros - sinDatosVihCount;
      setExamenesVihCompletosResult(examenesVihCompletos);

      const examenesSifilisCompletos = totalRegistros - sinDatosSifilisCount;
      setExamenesSifilisCompletosResult(examenesSifilisCompletos);
      
      const toxoplasmaValidos = totalRegistros - sinDatosToxoplasmaCount;
      setToxoplasmaValidosResult(toxoplasmaValidos);
      
      const examenesHbCompletos = totalRegistros - sinDatosHbCount;
      setExamenesHbCompletosResult(examenesHbCompletos);
      
      const chagasResultadosValidos = totalRegistros - sinDatosChagasCount;
      setChagasResultadosValidosResult(chagasResultadosValidos);

      const ecografiasValidas = totalRegistros - sinDatosEcografiaCount;
      setEcografiasValidasResult(ecografiasValidas);

      const nutricionValidos = totalRegistros - sinDatosNutricionCount;
      setNutricionResult(nutricionValidos);

      const odontologiaValidos = totalRegistros - sinDatosOdontologiaCount;
      setOdontologiaResult(odontologiaValidos);
      
      if (controlCount > 0) {
        setControlPercentageResult((captacionCount / controlCount) * 100);
        setResultadoTamizajeVihResult((examenesVihCompletos / controlCount) * 100);
        setResultadoTamizajeSifilisResult((examenesSifilisCompletos / controlCount) * 100);
        setResultadoToxoplasmaResult((toxoplasmaValidos / controlCount) * 100);
        setResultadoTamizajeHbResult((examenesHbCompletos / controlCount) * 100);
        setResultadoChagasResult((chagasResultadosValidos / controlCount) * 100);
        setResultadoEcografiasResult((ecografiasValidas / controlCount) * 100);
        setResultadoNutricionResult((nutricionValidos / controlCount) * 100);
        setResultadoOdontologiaResult((odontologiaValidos / controlCount) * 100);
      } else {
        setControlPercentageResult(0);
        setResultadoTamizajeVihResult(0);
        setResultadoTamizajeSifilisResult(0);
        setResultadoToxoplasmaResult(0);
        setResultadoTamizajeHbResult(0);
        setResultadoChagasResult(0);
        setResultadoEcografiasResult(0);
        setResultadoNutricionResult(0);
        setResultadoOdontologiaResult(0);
      }

      setControlesEnMes(inPeriodCount);
      setControlesFueraMes(outOfPeriodCount);
      setHasCalculated(true);

    } catch (err: any) {
      console.error(err);
      setAllData([]);
      setError(err.message || "Ocurrió un error al leer o procesar el archivo. Asegúrate de que el formato sea correcto y que las columnas necesarias existan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const yearMonths = (availableFiles as any)[year] ? Object.keys((availableFiles as any)[year]) : [];
    setMonths(yearMonths);
    setSelectedFile("");
    setSelectedMonth("");
    resetAll();
    setChartData([]);
  };

  const handleGenerateChart = async () => {
    if (!selectedYear || !months || months.length === 0) {
      setChartData([]);
      return;
    }
    
    setIsChartLoading(true);
    const dataPromises = months.map(async (monthName) => {
      try {
        const filePath = (availableFiles as any)[selectedYear]?.[monthName];
        if (!filePath) return null;

        const response = await fetch(filePath);
        if (!response.ok) return null;
        let workbook;
        if (filePath.endsWith('.csv')) {
          const text = await response.text();
          workbook = XLSX.read(text, { type: 'string' });
        } else {
          const data = await response.arrayBuffer();
          workbook = XLSX.read(data, { type: 'array' });
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        const defaultResult = { 
            name: monthName, 
            'Captación Oportuna': 0,
            'Tamizaje VIH': 0,
            'Tamizaje Sífilis': 0,
            'Tamizaje Toxoplasma': 0,
            'Tamizaje Hepatitis B': 0,
            'Tamizaje Chagas': 0,
            'Ecografías': 0,
            'Nutrición': 0,
            'Odontología': 0,
        };
        if (jsonData.length === 0) return defaultResult;


        const firstClean: any = {};
        Object.keys(jsonData[0]).forEach(k => { firstClean[cleanHeader(k)] = jsonData[0][k]; });
        
        const pickHeader = (rowObj: Record<string, any>, includes: string[]) => {
          const keys = Object.keys(rowObj);
          return keys.find(k => includes.every(frag => k.includes(frag))) || "";
        };

        const controlHeader = pickHeader(firstClean, ["identificacion"]);
        const captacionHeader = pickHeader(firstClean, ["edad", "gest", "inicio", "control"]);
        const vih1Header = pickHeader(firstClean, ["vih", "primer", "tamiz"]);
        const vih2Header = pickHeader(firstClean, ["vih", "segundo", "tamiz"]);
        const vih3Header = pickHeader(firstClean, ["vih", "tercer", "tamiz"]);
        const sifilis1Header = pickHeader(firstClean, ["sifilis", "primera"]);
        const sifilis2Header = pickHeader(firstClean, ["sifilis", "segunda"]);
        const sifilis3Header = pickHeader(firstClean, ["sifilis", "tercera"]);
        const toxoplasmaHeader = pickHeader(firstClean, ["toxoplasma", "resultado"]);
        const hbResultadoHeader = pickHeader(firstClean, ["hepatitis", "b", "resultado"]);
        const hbFechaHeader = pickHeader(firstClean, ["hepatitis", "b", "fecha"]);
        const chagasHeader = pickHeader(firstClean, ["chagas", "resultado"]);
        const eco1Header = pickHeader(firstClean, ["ecografia", "translucencia"]);
        const eco2Header = pickHeader(firstClean, ["ecografia", "anomalias"]);
        const eco3Header = pickHeader(firstClean, ["ecografia", "otras"]);
        const nutricionHeader = pickHeader(firstClean, ["nutricion"]);
        const odontologiaHeader = pickHeader(firstClean, ["odontolog", "fecha"]) || pickHeader(firstClean, ["odontolog"]);
        
        let controlCount = 0;
        let captacionCount = 0;
        let sinDatosVihCount = 0;
        let sinDatosSifilisCount = 0;
        let sinDatosToxoplasmaCount = 0;
        let sinDatosHbCount = 0;
        let sinDatosChagasCount = 0;
        let sinDatosEcografiaCount = 0;
        let sinDatosNutricionCount = 0;
        let sinDatosOdontologiaCount = 0;
        
        jsonData.forEach((row: any) => {
            const cleanedRow: { [key: string]: any } = {};
            for (const key in row) { cleanedRow[cleanHeader(key)] = row[key]; }
            const sd2 = (v: string) => v.trim() === '' || v.includes("sin datos") || v.includes("sin dato");
            if (cleanedRow[controlHeader]) controlCount++;
            if (cleanedRow[captacionHeader] && parseFloat(cleanedRow[captacionHeader]) < 10) captacionCount++;

            if (sd2(String(cleanedRow[vih1Header] || '').toLowerCase()) && sd2(String(cleanedRow[vih2Header] || '').toLowerCase()) && sd2(String(cleanedRow[vih3Header] || '').toLowerCase())) sinDatosVihCount++;
            if (sd2(String(cleanedRow[sifilis1Header] || '').toLowerCase()) && sd2(String(cleanedRow[sifilis2Header] || '').toLowerCase()) && sd2(String(cleanedRow[sifilis3Header] || '').toLowerCase())) sinDatosSifilisCount++;
            if (sd2(String(cleanedRow[toxoplasmaHeader] || '').toLowerCase())) sinDatosToxoplasmaCount++;
            if (sd2(String(cleanedRow[hbResultadoHeader] || '').toLowerCase()) && cleanedRow[hbFechaHeader]) sinDatosHbCount++;
            if (sd2(String(cleanedRow[chagasHeader] || '').toLowerCase())) sinDatosChagasCount++;
            if (sd2(String(cleanedRow[eco1Header] || '').toLowerCase()) && sd2(String(cleanedRow[eco2Header] || '').toLowerCase()) && sd2(String(cleanedRow[eco3Header] || '').toLowerCase())) sinDatosEcografiaCount++;
            if (sd2(String(cleanedRow[nutricionHeader] || '').toLowerCase())) sinDatosNutricionCount++;
            if (sd2(String(cleanedRow[odontologiaHeader] || '').toLowerCase())) sinDatosOdontologiaCount++;
        });

        const totalRegistros = jsonData.length;
        const examenesVihCompletos = totalRegistros - sinDatosVihCount;
        const examenesSifilisCompletos = totalRegistros - sinDatosSifilisCount;
        const toxoplasmaValidos = totalRegistros - sinDatosToxoplasmaCount;
        const examenesHbCompletos = totalRegistros - sinDatosHbCount;
        const chagasResultadosValidos = totalRegistros - sinDatosChagasCount;
        const ecografiasValidas = totalRegistros - sinDatosEcografiaCount;
        const nutricionValidos = totalRegistros - sinDatosNutricionCount;
        const odontologiaValidos = totalRegistros - sinDatosOdontologiaCount;

        return {
            name: monthName,
            'Captación Oportuna': controlCount > 0 ? (captacionCount / controlCount) * 100 : 0,
            'Tamizaje VIH': controlCount > 0 ? (examenesVihCompletos / controlCount) * 100 : 0,
            'Tamizaje Sífilis': controlCount > 0 ? (examenesSifilisCompletos / controlCount) * 100 : 0,
            'Tamizaje Toxoplasma': controlCount > 0 ? (toxoplasmaValidos / controlCount) * 100 : 0,
            'Tamizaje Hepatitis B': controlCount > 0 ? (examenesHbCompletos / controlCount) * 100 : 0,
            'Tamizaje Chagas': controlCount > 0 ? (chagasResultadosValidos / controlCount) * 100 : 0,
            'Ecografías': controlCount > 0 ? (ecografiasValidas / controlCount) * 100 : 0,
            'Nutrición': controlCount > 0 ? (nutricionValidos / controlCount) * 100 : 0,
            'Odontología': controlCount > 0 ? (odontologiaValidos / controlCount) * 100 : 0,
        };

      } catch (error) {
        console.error(`Error processing file for chart: ${monthName}`, error);
        return null;
      }
    });

    const results = (await Promise.all(dataPromises)).filter(Boolean) as ChartDataItem[];
    setChartData(results);
    setIsChartLoading(false);
  };

  const chartGroups = [
      { title: 'Resumen Mensual de Captación', dataKey: 'Captación Oportuna', color: 'hsl(var(--chart-1))' },
      { title: 'Resumen Mensual de Tamizaje VIH', dataKey: 'Tamizaje VIH', color: 'hsl(var(--chart-2))' },
      { title: 'Resumen Mensual de Tamizaje Sífilis', dataKey: 'Tamizaje Sífilis', color: 'hsl(var(--chart-3))' },
      { title: 'Resumen Mensual de Tamizaje Toxoplasma', dataKey: 'Tamizaje Toxoplasma', color: 'hsl(var(--chart-4))' },
      { title: 'Resumen Mensual de Tamizaje Hepatitis B', dataKey: 'Tamizaje Hepatitis B', color: 'hsl(var(--chart-5))' },
      { title: 'Resumen Mensual de Tamizaje Chagas', dataKey: 'Tamizaje Chagas', color: 'hsl(var(--chart-1))' },
      { title: 'Resumen Mensual de Ecografías', dataKey: 'Ecografías', color: 'hsl(var(--chart-2))' },
      { title: 'Resumen Mensual de Nutrición', dataKey: 'Nutrición', color: 'hsl(var(--chart-3))' },
      { title: 'Resumen Mensual de Odontología', dataKey: 'Odontología', color: 'hsl(var(--chart-4))' },
  ];

  const handleFileChange = (value: string) => {
    const month = value;
    const filePath = (availableFiles as any)[selectedYear]?.[month];
    setSelectedFile(filePath || "");
    setSelectedMonth(month);
    setAllData([]);
    setHasCalculated(false);
    setDepartments([]);
    setMunicipalities([]);
    setIpsList([]);
    setSelectedDepartment("");
    setSelectedMunicipality("");
    setSelectedIps("");
  };

  const resetAll = () => {
    setAllData([]);
    setError(null);
    setHasCalculated(false);
    setDepartments([]);
    setMunicipalities([]);
    setIpsList([]);
    setSelectedDepartment("");
    setSelectedMunicipality("");
    setSelectedIps("");
  };
  
  const handleDepartmentChange = (value: string) => {
    const newDept = value === 'todos' ? '' : value;
    setSelectedDepartment(newDept);
    setSelectedMunicipality('');
    setSelectedIps('');
  
    let munis = new Set<string>();
    let ips = new Set<string>();

    if (newDept) {
        filterData.filter(d => d.dept === newDept).forEach(d => {
            munis.add(d.muni);
            ips.add(d.ips);
        });
    } else {
        filterData.forEach(d => {
            munis.add(d.muni);
            ips.add(d.ips);
        });
    }
    setMunicipalities(Array.from(munis).sort());
    setIpsList(Array.from(ips).sort());
  };

  const handleMunicipalityChange = (value: string) => {
    const newMuni = value === 'todos' ? '' : value;
    setSelectedMunicipality(newMuni);
    setSelectedIps('');

    let ips = new Set<string>();
    if(newMuni) {
        filterData.filter(d => d.muni === newMuni).forEach(d => ips.add(d.ips));
    } else {
        const deptFiltered = filterData.filter(d => !selectedDepartment || d.dept === selectedDepartment);
        deptFiltered.forEach(d => ips.add(d.ips));
    }
    setIpsList(Array.from(ips).sort());
  }

  const handleIpsChange = (value: string) => {
    const newIps = value === 'todos' ? '' : value;
    setSelectedIps(newIps);
    if (newIps) {
      // Al seleccionar una IPS específica, limpiamos municipio para ver TODOS los municipios de esa IPS
      setSelectedMunicipality('');
      // Re-expandimos la lista de IPS al scope del departamento seleccionado (no solo del municipio)
      const base = selectedDepartment
        ? filterData.filter(d => d.dept === selectedDepartment)
        : filterData;
      setIpsList(Array.from(new Set(base.map(d => d.ips))).sort());
    }
  }
  
  const prepararDatosParaPdf = (kpiData: KpiResults, ips: string, recomendacionesAI?: string[], analisisAnual?: string): InformeDatos => {
    const monthName = selectedMonth || 'N/A';
    return {
        encabezado: {
            proceso: "Seguimiento a la Gestión del Riesgo en Salud",
            formato: "Informe de Evaluación de Indicadores",
            entidad: ips,
            vigencia: monthName,
            lugarFecha: `VALLEDUPAR, ${new Date().toLocaleDateString('es-CO')}`
        },
        referencia: "Análisis de indicadores de gestantes basado en el archivo cargado.",
        analisisResumido: [
            `Total de gestantes en control: ${kpiData.gestantesControlResult}`,
            `Gestantes con captación oportuna: ${kpiData.kpiResult} (${kpiData.controlPercentageResult?.toFixed(2)}%)`
        ],
        datosAExtraer: [
            { label: "Gestantes en Control", valor: String(kpiData.gestantesControlResult) },
            { label: "Captación Oportuna (< 10 sem)", valor: String(kpiData.kpiResult) },
            { label: "% Captación Oportuna", valor: `${kpiData.controlPercentageResult?.toFixed(2)}%` },
            { label: "Exámenes VIH Completos", valor: String(kpiData.examenesVihCompletosResult) },
            { label: "% Tamizaje VIH", valor: `${kpiData.resultadoTamizajeVihResult?.toFixed(2)}%` },
            { label: "Exámenes Sífilis Completos", valor: String(kpiData.examenesSifilisCompletosResult) },
            { label: "% Tamizaje Sífilis", valor: `${kpiData.resultadoTamizajeSifilisResult?.toFixed(2)}%` },
        ],
        analisisAnual: analisisAnual,
        hallazgosCalidad: [
            "Completar datos clínicos clave que permitan el adecuado seguimiento de la gestante, tales como la fecha de última menstruación, fundamental para el cálculo gestacional.",
            "Asegurar la clasificación del riesgo obstétrico durante el control prenatal, de acuerdo con los lineamientos establecidos (ARO/BRO).",
            "Registrar adecuadamente los factores de riesgo identificados, especialmente en gestantes clasificadas como alto riesgo.",
            "Evitar la alteración o eliminación de fórmulas preestablecidas en las bases de datos, ya que comprometen la integridad del análisis.",
            "Verificar la coherencia en el diligenciamiento de resultados de tamizajes, como VIH y Sífilis, respetando las casillas correspondientes.",
            "Garantizar el registro completo y adecuado de exámenes de laboratorio, justificando cualquier omisión en las casillas de observaciones, conforme a los lineamientos institucionales.",
            "Asegurar la orden y realización oportuna de ecografías obstétricas, siguiendo el cronograma recomendado para cada trimestre.",
            "Normalizar el registro de pruebas serológicas como toxoplasma y rubéola, usando las categorías establecidas (Positivo o Negativo), evitando otros formatos o errores de digitación.",
            "Promover y documentar la realización de citología cervicouterina según edad gestacional y criterios clínicos establecidos.",
            "Registrar de manera oportuna la aplicación de vacunas correspondientes, conforme al esquema definido para gestantes.",
            "Garantizar y registrar la entrega de suplementos nutricionales, como hierro, ácido fólico y otros micronutrientes según protocolos.",
            "Actualizar los desenlaces obstétricos (nacimientos, abortos, muertes maternas y perinatales), migrando los casos cerrados a la pestaña correspondiente en la base de datos.",
            "Fortalecer la captación temprana de gestantes, priorizando el ingreso antes de la semana 12 de gestación y registrando las razones de ingreso tardío cuando aplique.",
        ],
        recomendaciones: recomendacionesAI || [
            "Diseñar y aplicar los procesos de evaluación y seguimiento a la ruta materno perinatal.",
            "Implementar las acciones de mejora para el fortalecimiento de la ruta materno perinatal.",
            "Fortalecer la demanda inducida institucional para la captación temprana de la gestante (antes de las 12 semanas) especificar en observaciones el ingreso tardío.",
            "Implementar la tamización con pruebas rápidas (VIH – Sífilis) para dar cumplimiento a la ruta de atención materno perinatal garantizando la tamización por trimestre.",
            "Garantizar la atención ginecológica, nutricional, odontológica y psicológica de todas las gestantes inscritas al programa de atención al control prenatal teniendo en cuenta la clasificación del riesgo y los tiempos establecidos en la resolución 3280/2018 para la consulta por especialista."
        ],
        observaciones: [
            "Se solicitan historias clínicas las cuales no han sido enviadas a la fecha por lo que no se realiza auditoria de historias durante el mes de junio.",
            "En base a los hallazgos y no conformidades encontradas queda el compromiso por parte de la IPS de enviar la base de datos del siguiente mes aplicando los correctivos para el mejoramiento continuo de la calidad y seguimiento oportuno a las gestantes."
        ],
    };
  };

  const handleGeneratePdf = async () => {
    if (kpiResult === null) return;
    setIsLoading(true);

    const currentKpiData: KpiResults = {
        kpiResult, gestantesControlResult, controlPercentageResult, examenesVihCompletosResult, resultadoTamizajeVihResult,
        examenesSifilisCompletosResult, resultadoTamizajeSifilisResult, toxoplasmaValidosResult, resultadoToxoplasmaResult,
        examenesHbCompletosResult, resultadoTamizajeHbResult, chagasResultadosValidosResult, resultadoChagasResult,
        ecografiasValidasResult, resultadoEcografiasResult, nutricionResult, resultadoNutricionResult, odontologiaResult,
        resultadoOdontologiaResult, ginecologiaResult, denominadorGinecologiaResult, porcentajeGinecologiaResult
    };
    
    try {
        const datosParaPdf = prepararDatosParaPdf(currentKpiData, selectedIps || "Consolidado General");
        const images: PdfImages = { background: '/imagenes/IMAGENEN UNIFICADA.jpg' };
        await generarInformePDF(datosParaPdf, images);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGeneratePdfsEnMasa = async () => {
    if (!allData.length || !ipsList.length) {
        setError("Por favor, primero calcula los indicadores para cargar los datos.");
        return;
    }
    setIsLoading(true);
    const zip = new JSZip();
    
    for (const ips of ipsList) {
        const kpiDataForIps = await calculateKpiForFilter('', '', ips); 
        
        try {
            const datosParaPdf = prepararDatosParaPdf(kpiDataForIps, ips);
            const images: PdfImages = { background: '/imagenes/IMAGENEN UNIFICADA.jpg' };
            const blob = await generarInformePDF(datosParaPdf, images, '', true);

            if (blob) {
                const fileName = `Informe_Riesgo_${ips.replace(/\s/g, '_')}.pdf`;
                zip.file(fileName, blob);
            }
        } catch (pdfError) {
            console.error(`Error generando PDF para ${ips}:`, pdfError);
        }
    }

    zip.generateAsync({ type: "blob" }).then(content => {
        saveAs(content, `Informes_por_IPS_${new Date().toISOString().slice(0,10)}.zip`);
    });

    setIsLoading(false);
  };


  const calculateKpiForFilter = async (department: string, municipality: string, ips: string): Promise<KpiResults> => {
    // This function requires allData to be populated from a single month's file.
    // It is used for the mass PDF generation, which depends on a single month context.
    const fileData = allData;
    
    return new Promise<KpiResults>(resolve => {
        const pickHeader = (rowObj: Record<string, any>, includes: string[]) => {
            const keys = Object.keys(rowObj);
            return keys.find(k => includes.every(frag => k.includes(frag))) || "";
        };

        const firstClean: any = {};
        const originalHeaders: Record<string, string> = {};
        if (fileData.length === 0) {
            resolve({} as KpiResults); // return empty if no data
            return;
        }
        for (const k in fileData[0]) {
            const cleanedK = cleanHeader(k);
            firstClean[cleanedK] = fileData[0][k];
            originalHeaders[cleanedK] = k;
        }

        const departmentHeaderRaw = originalHeaders[pickHeader(firstClean, ["departamento_residencia"])];
        const municipalityHeaderRaw = originalHeaders[pickHeader(firstClean, ["municipio_de_residencia"])];
        const ipsHeaderRaw = originalHeaders[pickHeader(firstClean, ["nombre", "ips", "primaria"])];


        const filteredData = fileData.filter(row => {
            const rowDept = String(row[departmentHeaderRaw] || '').trim().replace(/\s+/g, ' ').toUpperCase();
            const rowMuni = String(row[municipalityHeaderRaw] || '').trim().replace(/\s+/g, ' ').toUpperCase();
            const rowIps = String(row[ipsHeaderRaw] || '').trim().replace(/\s+/g, ' ').toUpperCase();

            const deptMatch = !department || rowDept === department;
            const muniMatch = !municipality || rowMuni === municipality;
            const ipsMatch = !ips || rowIps === ips;

            return deptMatch && muniMatch && ipsMatch;
        });

        const controlHeader = pickHeader(firstClean, ["identificacion"]);
        const captacionHeader = pickHeader(firstClean, ["edad", "gest", "inicio", "control"]);
        const vih1Header = pickHeader(firstClean, ["vih", "primer", "tamiz"]);
        const vih2Header = pickHeader(firstClean, ["vih", "segundo", "tamiz"]);
        const vih3Header = pickHeader(firstClean, ["vih", "tercer", "tamiz"]);
        const sifilis1Header = pickHeader(firstClean, ["sifilis", "primera"]);
        const sifilis2Header = pickHeader(firstClean, ["sifilis", "segunda"]);
        const sifilis3Header = pickHeader(firstClean, ["sifilis", "tercera"]);
        const toxoplasmaHeader = pickHeader(firstClean, ["toxoplasma", "resultado"]);
        const hbResultadoHeader = pickHeader(firstClean, ["hepatitis", "b", "resultado"]);
        const hbFechaHeader = pickHeader(firstClean, ["hepatitis", "b", "fecha"]);
        const chagasHeader = pickHeader(firstClean, ["chagas", "resultado"]);
        const eco1Header = pickHeader(firstClean, ["ecografia", "translucencia"]);
        const eco2Header = pickHeader(firstClean, ["ecografia", "anomalias"]);
        const eco3Header = pickHeader(firstClean, ["ecografia", "otras"]);
        const nutricionHeader = pickHeader(firstClean, ["nutricion"]);
        const odontologiaHeader = pickHeader(firstClean, ["odontolog", "fecha"]) || pickHeader(firstClean, ["odontolog"]);
        
        let captacionCount = 0;
        let controlCount = 0;
        let sinDatosVihCount = 0;
        let sinDatosSifilisCount = 0;
        let sinDatosToxoplasmaCount = 0;
        let sinDatosHbCount = 0;
        let sinDatosChagasCount = 0;
        let sinDatosEcografiaCount = 0;
        let sinDatosNutricionCount = 0;
        let sinDatosOdontologiaCount = 0;
        const totalRegistros = filteredData.length;

        const numeradorGinecologia = calcularNumeradorGinecologia(filteredData);
        const denominadorGinecologia = calcularDenominadorGinecologia(filteredData);

        filteredData.forEach((row: any) => {
          const cleanedRow: { [key: string]: any } = {};
          for (const key in row) {
              cleanedRow[cleanHeader(key)] = row[key];
          }

          const controlValue = cleanedRow[controlHeader];
          if (controlValue !== undefined && controlValue !== "") {
              controlCount++;
          }
          
          const captacionValue = cleanedRow[captacionHeader];
          if (captacionValue !== undefined && captacionValue !== "" && !isNaN(parseFloat(captacionValue)) && parseFloat(captacionValue) < 10) {
            captacionCount++;
          }

          const sd = (v: string) => v.trim() === '' || v.includes("sin datos") || v.includes("sin dato");

          const vih1Value = String(cleanedRow[vih1Header] || '').toLowerCase();
          const vih2Value = String(cleanedRow[vih2Header] || '').toLowerCase();
          const vih3Value = String(cleanedRow[vih3Header] || '').toLowerCase();
          if (sd(vih1Value) && sd(vih2Value) && sd(vih3Value)) {
            sinDatosVihCount++;
          }

          const sif1Value = String(cleanedRow[sifilis1Header] || '').toLowerCase().trim();
          const sif2Value = String(cleanedRow[sifilis2Header] || '').toLowerCase().trim();
          const sif3Value = String(cleanedRow[sifilis3Header] || '').toLowerCase().trim();
          if (sd(sif1Value) && sd(sif2Value) && sd(sif3Value)) {
              sinDatosSifilisCount++;
          }

          const toxoplasmaValue = String(cleanedRow[toxoplasmaHeader] || '').toLowerCase().trim();
          if (sd(toxoplasmaValue)) {
              sinDatosToxoplasmaCount++;
          }

          const hbResultadoValue = String(cleanedRow[hbResultadoHeader] || '').toLowerCase().trim();
          const hbFechaValue = cleanedRow[hbFechaHeader];
          if (sd(hbResultadoValue) && !(hbFechaValue === undefined || hbFechaValue === "")) {
              sinDatosHbCount++;
          }

          const chagasValue = String(cleanedRow[chagasHeader] || '').toLowerCase().trim();
          if (sd(chagasValue)) {
              sinDatosChagasCount++;
          }

          const eco1Value = String(cleanedRow[eco1Header] || '').toLowerCase().trim();
          const eco2Value = String(cleanedRow[eco2Header] || '').toLowerCase().trim();
          const eco3Value = String(cleanedRow[eco3Header] || '').toLowerCase().trim();
          if (sd(eco1Value) && sd(eco2Value) && sd(eco3Value)) {
              sinDatosEcografiaCount++;
          }

          const nutricionValue = String(cleanedRow[nutricionHeader] || '').toLowerCase().trim();
          if (sd(nutricionValue)) {
              sinDatosNutricionCount++;
          }

          const odontologiaValue = String(cleanedRow[odontologiaHeader] || '').toLowerCase().trim();
          if (sd(odontologiaValue)) {
              sinDatosOdontologiaCount++;
          }
        });
        
        const examenesVihCompletos = totalRegistros - sinDatosVihCount;
        const examenesSifilisCompletos = totalRegistros - sinDatosSifilisCount;
        const toxoplasmaValidos = totalRegistros - sinDatosToxoplasmaCount;
        const examenesHbCompletos = totalRegistros - sinDatosHbCount;
        const chagasResultadosValidos = totalRegistros - sinDatosChagasCount;
        const ecografiasValidas = totalRegistros - sinDatosEcografiaCount;
        const nutricionValidos = totalRegistros - sinDatosNutricionCount;
        const odontologiaValidos = totalRegistros - sinDatosOdontologiaCount;

        const results: KpiResults = {
            kpiResult: captacionCount,
            gestantesControlResult: controlCount,
            controlPercentageResult: controlCount > 0 ? (captacionCount / controlCount) * 100 : 0,
            examenesVihCompletosResult: examenesVihCompletos,
            resultadoTamizajeVihResult: controlCount > 0 ? (examenesVihCompletos / controlCount) * 100 : 0,
            examenesSifilisCompletosResult: examenesSifilisCompletos,
            resultadoTamizajeSifilisResult: controlCount > 0 ? (examenesSifilisCompletos / controlCount) * 100 : 0,
            toxoplasmaValidosResult: toxoplasmaValidos,
            resultadoToxoplasmaResult: controlCount > 0 ? (toxoplasmaValidos / controlCount) * 100 : 0,
            examenesHbCompletosResult: examenesHbCompletos,
            resultadoTamizajeHbResult: controlCount > 0 ? (examenesHbCompletos / controlCount) * 100 : 0,
            chagasResultadosValidosResult: chagasResultadosValidos,
            resultadoChagasResult: controlCount > 0 ? (chagasResultadosValidos / controlCount) * 100 : 0,
            ecografiasValidasResult: ecografiasValidas,
            resultadoEcografiasResult: controlCount > 0 ? (ecografiasValidas / controlCount) * 100 : 0,
            nutricionResult: nutricionValidos,
            resultadoNutricionResult: controlCount > 0 ? (nutricionValidos / controlCount) * 100 : 0,
            odontologiaResult: odontologiaValidos,
            resultadoOdontologiaResult: controlCount > 0 ? (odontologiaValidos / controlCount) * 100 : 0,
            ginecologiaResult: numeradorGinecologia,
            denominadorGinecologiaResult: denominadorGinecologia,
            porcentajeGinecologiaResult: denominadorGinecologia > 0 ? (numeradorGinecologia / denominadorGinecologia) * 100 : 0,
        };
        
        resolve(results);
    });
};

const handleDownloadConsolidatedXls = async () => {
    if (!allData.length || !filterData.length) {
      setError("Por favor, primero calcula los indicadores para un mes para poder generar el consolidado.");
      return;
    }
    setIsLoading(true);

    const consolidatedData: any[] = [];
    // Clave única = municipio + IPS → DUSAKAWI en 7 municipios = 7 filas separadas
    const seen = new Set<string>();
    const uniqueIpsEntries = filterData.filter(item => {
      const key = `${item.muni}||${item.ips}`;
      if (seen.has(key) || !item.ips) return false;
      seen.add(key);
      return true;
    });

    for (const entry of uniqueIpsEntries) {
      const { dept, muni, ips } = entry;
      if (!ips) continue;

      const kpiData = await calculateKpiForFilter(dept, muni, ips);

      consolidatedData.push({
        'DEPARTAMENTO': dept,
        'MUNICIPIO': muni,
        'IPS': ips,
        'Gestantes en Control': kpiData.gestantesControlResult,
        'Captación Oportuna (< 10 sem)': kpiData.kpiResult,
        '% Captación Oportuna': kpiData.controlPercentageResult,
        'Exámenes VIH Completos': kpiData.examenesVihCompletosResult,
        '% Tamizaje VIH': kpiData.resultadoTamizajeVihResult,
        'Exámenes Sífilis Completos': kpiData.examenesSifilisCompletosResult,
        '% Tamizaje Sífilis': kpiData.resultadoTamizajeSifilisResult,
        'Toxoplasma Válidos': kpiData.toxoplasmaValidosResult,
        '% Tamizaje Toxoplasma': kpiData.resultadoToxoplasmaResult,
        'Exámenes Hepatitis B Completos': kpiData.examenesHbCompletosResult,
        '% Tamizaje Hepatitis B': kpiData.resultadoTamizajeHbResult,
        'Chagas Válidos': kpiData.chagasResultadosValidosResult,
        '% Tamizaje Chagas': kpiData.resultadoChagasResult,
        'Ecografías Válidas': kpiData.ecografiasValidasResult,
        '% Ecografías': kpiData.resultadoEcografiasResult,
        'Consultas Nutrición': kpiData.nutricionResult,
        '% Nutrición': kpiData.resultadoNutricionResult,
        'Consultas Odontología': kpiData.odontologiaResult,
        '% Odontología': kpiData.resultadoOdontologiaResult,
        'Gestantes Alto Riesgo con Ginecología': kpiData.ginecologiaResult,
        'Total Gestantes Alto Riesgo': kpiData.denominadorGinecologiaResult,
        '% Cobertura Ginecología (Alto Riesgo)': kpiData.porcentajeGinecologiaResult,
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(consolidatedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Consolidado Indicadores");
    
    // Format percentages
    const percentageCols = ['F', 'H', 'J', 'L', 'N', 'P', 'R', 'T', 'W'];
    for (let i = 2; i <= consolidatedData.length + 1; i++) {
        percentageCols.forEach(col => {
            const cellRef = `${col}${i}`;
            if (worksheet[cellRef] && worksheet[cellRef].v !== null) {
                worksheet[cellRef].z = '0.00%';
                worksheet[cellRef].v = (worksheet[cellRef].v as number) / 100;
            }
        });
    }

    const xlsBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([xlsBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    
    const monthName = selectedMonth || 'mes';
    saveAs(data, `Consolidado_Indicadores_${monthName}_${selectedYear}.xlsx`);

    setIsLoading(false);
  };
  
  const handleGenerateAnnualReport = async () => {
    if (!chartData.length || !selectedYear) {
      setError("Por favor, genera primero los gráficos de la vigencia para tener los datos anuales.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
        // 1. Análisis automático basado en datos reales
        const promedios: Record<string, number> = {};
        const indicadores = ['Captación Oportuna','Tamizaje VIH','Tamizaje Sífilis','Tamizaje Toxoplasma','Tamizaje Hepatitis B','Tamizaje Chagas','Ecografías','Nutrición','Odontología'];
        indicadores.forEach(ind => {
            const vals = chartData.map((d: any) => d[ind] ?? 0).filter((v: number) => v > 0);
            promedios[ind] = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
        });
        const mejores = indicadores.filter(i => promedios[i] >= 80).join(', ') || 'Ninguno supera el 80%';
        const criticos = indicadores.filter(i => promedios[i] < 60).join(', ') || 'Todos superan el 60%';
        const meses = chartData.map((d: any) => d.name).join(', ');
        const analysis = `INFORME DE VIGENCIA ${selectedYear} — ${selectedIps || 'Consolidado General'}\n\n` +
            `Meses analizados: ${meses}.\n\n` +
            `RESUMEN DE PROMEDIOS:\n${indicadores.map(i => `• ${i}: ${promedios[i].toFixed(1)}%`).join('\n')}\n\n` +
            `INDICADORES CON BUEN DESEMPEÑO (≥80%): ${mejores}.\n\n` +
            `INDICADORES CRÍTICOS (<60%): ${criticos}.\n\n` +
            `RECOMENDACIÓN: Fortalecer los procesos de seguimiento en los indicadores críticos mediante estrategias de demanda inducida, verificación de registros y articulación con las IPS prestadoras de servicios materno-perinatales.`;

        // 2. Capturar imágenes de gráficos
        const chartImages: { id: string; dataUrl: string }[] = [];
        if (chartContainerRef.current) {
            const chartElements = chartContainerRef.current.querySelectorAll('.recharts-responsive-container');
            for (let i = 0; i < chartElements.length; i++) {
                const canvas = await html2canvas(chartElements[i] as HTMLElement);
                chartImages.push({ id: `chart${i + 1}`, dataUrl: canvas.toDataURL('image/png') });
            }
        }

        const images: PdfImages = {
            background: '/imagenes/IMAGENEN UNIFICADA.jpg',
            charts: chartImages.length > 0 ? chartImages : undefined
        };

        const datosParaPdf = prepararDatosParaPdf({} as KpiResults, selectedIps || "Dusakawi EPSI (Consolidado)", undefined, analysis);
        const fileName = `Informe_Anual_${selectedYear}.pdf`;
        await generarInformePDF(datosParaPdf, images, fileName);

    } catch (err: any) {
        console.error("Error generating annual report:", err);
        setError(err.message || "Ocurrió un error al generar el informe anual.");
    } finally {
        setIsLoading(false);
    }
  };

  const kpiGroups = [
    {
      title: "Indicadores de Captación",
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Captación Oportuna", value: kpiResult, description: "Gestantes con control antes de la semana 10." },
        { title: "Control de Gestantes", value: controlPercentageResult, isPercentage: true, description: "Porcentaje de control." },
      ]
    },
    {
      title: "Indicadores de Tamizaje VIH",
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Exámenes VIH Completos", value: examenesVihCompletosResult, description: "Gestantes con al menos 1 tamizaje VIH." },
        { title: "Resultado Tamizaje VIH", value: resultadoTamizajeVihResult, isPercentage: true, description: "Porcentaje de tamizaje VIH." },
      ]
    },
    {
      title: "Indicadores de Tamizaje Sífilis",
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Exámenes Sífilis Completos", value: examenesSifilisCompletosResult, description: "Gestantes con al menos 1 tamizaje Sífilis." },
        { title: "Resultado Tamizaje Sífilis", value: resultadoTamizajeSifilisResult, isPercentage: true, description: "Porcentaje de tamizaje Sífilis." },
      ]
    },
    {
      title: "Indicadores de Tamizaje Toxoplasma",
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Toxoplasma Válidos", value: toxoplasmaValidosResult, description: "Gestantes con tamizaje Toxoplasma válido." },
        { title: "Resultado de Toxoplasma", value: resultadoToxoplasmaResult, isPercentage: true, description: "Porcentaje de tamizaje Toxoplasma." },
      ]
    },
    {
      title: "Indicadores de Tamizaje Hepatitis B",
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Exámenes HB Completos", value: examenesHbCompletosResult, description: "Gestantes con tamizaje Hepatitis B válido." },
        { title: "Resultado Tamizaje HB", value: resultadoTamizajeHbResult, isPercentage: true, description: "Porcentaje de tamizaje Hepatitis B." },
      ]
    },
    {
      title: "Indicadores de Tamizaje Chagas",
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { "title": "Chagas Resultados Válidos", "value": chagasResultadosValidosResult, "description": "Gestantes con tamizaje de Chagas válido." },
        { title: "Resultado Chagas", value: resultadoChagasResult, isPercentage: true, description: "Porcentaje de tamizaje de Chagas." },
      ]
    },
    {
      title: "Indicadores de Ecografías",
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Ecografías Válidas", value: ecografiasValidasResult, description: "Gestantes con ecografías válidas." },
        { title: "Resultado Ecografías", value: resultadoEcografiasResult, isPercentage: true, description: "Porcentaje de ecografías." },
      ]
    },
    {
      title: "Indicadores de Nutrición",
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Nutrición", value: nutricionResult, description: "Gestantes con consulta de nutrición." },
        { title: "Resultado Nutrición", value: resultadoNutricionResult, isPercentage: true, description: "Porcentaje de consulta de nutrición." },
      ]
    },
     {
      title: "Indicadores de Odontología",
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Odontología", value: odontologiaResult, description: "Gestantes con consulta de odontología." },
        { title: "Resultado Odontología", value: resultadoOdontologiaResult, isPercentage: true, description: "Porcentaje de consulta de odontología." },
      ]
    },
    {
      title: "Indicadores de Ginecología (Alto Riesgo)",
      kpis: [
        { title: "Numerador Ginecología", value: ginecologiaResult, description: "Gestantes de alto riesgo con consulta de ginecología válida." },
        { title: "Denominador Ginecología", value: denominadorGinecologiaResult, description: "Total de gestantes con clasificación de 'Alto Riesgo Obstétrico'." },
        { title: "Cobertura Ginecología", value: porcentajeGinecologiaResult, isPercentage: true, description: "Porcentaje de gestantes de alto riesgo con consulta de ginecología." },
      ]
    },
    {
      title: "Indicadores de Último Control Prenatal",
      kpis: [
        { title: "Controles en el Mes", value: controlesEnMes, description: "Controles prenatales realizados en el mes seleccionado." },
        { title: "Controles Fuera del Mes", value: controlesFueraMes, description: "Controles prenatales realizados fuera del mes seleccionado." },
      ]
    }
  ];

  const groupPalette = [
    { accent: "text-teal-300",   border: "border-teal-500/25",   bg: "bg-teal-500/8",    bar: "bg-teal-400",    dot: "bg-teal-400"   },
    { accent: "text-purple-300", border: "border-purple-500/25", bg: "bg-purple-500/8",  bar: "bg-purple-400",  dot: "bg-purple-400" },
    { accent: "text-rose-300",   border: "border-rose-500/25",   bg: "bg-rose-500/8",    bar: "bg-rose-400",    dot: "bg-rose-400"   },
    { accent: "text-orange-300", border: "border-orange-500/25", bg: "bg-orange-500/8",  bar: "bg-orange-400",  dot: "bg-orange-400" },
    { accent: "text-yellow-300", border: "border-yellow-500/25", bg: "bg-yellow-500/8",  bar: "bg-yellow-400",  dot: "bg-yellow-400" },
    { accent: "text-red-300",    border: "border-red-500/25",    bg: "bg-red-500/8",     bar: "bg-red-400",     dot: "bg-red-400"    },
    { accent: "text-blue-300",   border: "border-blue-500/25",   bg: "bg-blue-500/8",    bar: "bg-blue-400",    dot: "bg-blue-400"   },
    { accent: "text-green-300",  border: "border-green-500/25",  bg: "bg-green-500/8",   bar: "bg-green-400",   dot: "bg-green-400"  },
    { accent: "text-cyan-300",   border: "border-cyan-500/25",   bg: "bg-cyan-500/8",    bar: "bg-cyan-400",    dot: "bg-cyan-400"   },
    { accent: "text-violet-300", border: "border-violet-500/25", bg: "bg-violet-500/8",  bar: "bg-violet-400",  dot: "bg-violet-400" },
    { accent: "text-indigo-300", border: "border-indigo-500/25", bg: "bg-indigo-500/8",  bar: "bg-indigo-400",  dot: "bg-indigo-400" },
  ];

  const groupEmojis = ["🤰","🔬","🧫","🦠","🧪","🩸","📡","🥗","🦷","👩‍⚕️","📅"];

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(135deg, #0f172a 0%, #0c1a2e 40%, #0f2027 70%, #0f172a 100%)" }}>

      {/* ── TOP HEADER ────────────────────────────────────────────── */}
      <header style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        className="sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
            style={{ background: "linear-gradient(135deg, #14b8a6, #3b82f6)", boxShadow: "0 0 20px rgba(20,184,166,0.4)" }}>
            🤰
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg sm:text-xl tracking-tight leading-tight">
              Sistema de Indicadores Materno-Perinatales
            </h1>
            <p className="text-blue-300/70 text-xs sm:text-sm truncate">
              Seguimiento a la Gestión del Riesgo en Salud · Dusakawi EPSI
            </p>
          </div>
          {hasCalculated && gestantesControlResult !== null && (
            <div className="hidden sm:flex flex-col items-end flex-shrink-0">
              <span className="text-white/40 text-xs uppercase tracking-widest">Gestantes</span>
              <span className="text-teal-300 text-2xl font-bold leading-none">{gestantesControlResult.toLocaleString()}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* ── SELECCIÓN ─────────────────────────────────────────────── */}
        <section className="rounded-3xl p-6 shadow-2xl"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-5">📁 Selección de Datos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="space-y-2">
              <Label className="text-blue-200/80 text-sm font-medium">Año</Label>
              <Select onValueChange={handleYearChange} value={selectedYear}>
                <SelectTrigger className="h-11 rounded-xl border-white/15 text-white" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <SelectValue placeholder="Elige un año..." />
                </SelectTrigger>
                <SelectContent style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }} className="text-white">
                  {Object.keys(availableFiles).map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-blue-200/80 text-sm font-medium">Mes</Label>
              <Select onValueChange={handleFileChange} value={selectedMonth} disabled={!selectedYear}>
                <SelectTrigger className="h-11 rounded-xl border-white/15 text-white disabled:opacity-40" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <SelectValue placeholder="Elige un mes..." />
                </SelectTrigger>
                <SelectContent style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }} className="text-white">
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleGenerateChart} disabled={isChartLoading || !selectedYear}
              className="flex-1 h-12 rounded-xl font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 4px 15px rgba(37,99,235,0.35)" }}>
              {isChartLoading ? "⏳ Generando..." : "📊 Gráficos de Vigencia"}
            </Button>
            <Button onClick={() => calculateKpi(true)} disabled={isLoading || !selectedFile}
              className="flex-1 h-12 rounded-xl font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #14b8a6, #059669)", boxShadow: "0 4px 15px rgba(20,184,166,0.35)" }}>
              {isLoading ? "⏳ Calculando..." : "✅ Calcular Indicadores"}
            </Button>
          </div>
        </section>

        {/* ── ERROR ─────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <span className="text-red-400 text-xl flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="text-red-300 font-semibold text-sm">Error</p>
              <p className="text-red-400/80 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── LOADING ───────────────────────────────────────────────── */}
        {(isLoading || isChartLoading) && (
          <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-blue-200/80 text-sm">
              {isChartLoading ? "Cargando datos de gráficos..." : "Procesando datos, por favor espera..."}
            </p>
          </div>
        )}

        {/* ── GRÁFICOS ──────────────────────────────────────────────── */}
        {chartData.length > 0 && !isChartLoading && (
          <section className="rounded-3xl p-6 shadow-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}
            ref={chartContainerRef}>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
              📈 Tendencia Mensual · {selectedYear}
            </p>
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent>
                {chartGroups.map((chartInfo, index) => (
                  <CarouselItem key={index} className="md:basis-1/1">
                    <div className="p-1">
                      <h3 className="text-white/70 text-sm font-semibold mb-3 text-center">{chartInfo.title} ({selectedYear})</h3>
                      <MonthlyKpiChart data={chartData} dataKey={chartInfo.dataKey} fillColor={chartInfo.color} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="text-white border-white/20 hover:bg-white/10" style={{ background: "rgba(255,255,255,0.08)" }} />
              <CarouselNext className="text-white border-white/20 hover:bg-white/10" style={{ background: "rgba(255,255,255,0.08)" }} />
            </Carousel>
          </section>
        )}

        {/* ── FILTROS ───────────────────────────────────────────────── */}
        {hasCalculated && (
          <section className="rounded-3xl p-6 shadow-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-5">🔍 Filtros</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Departamento", value: selectedDepartment, onChange: handleDepartmentChange, options: departments, placeholder: "Todos", disabled: departments.length === 0 },
                { label: "Municipio",    value: selectedMunicipality, onChange: handleMunicipalityChange, options: municipalities, placeholder: "Todos", disabled: municipalities.length === 0 },
                { label: "IPS Primaria", value: selectedIps,          onChange: handleIpsChange,          options: ipsList,         placeholder: "Todas", disabled: ipsList.length === 0 },
              ].map(({ label, value, onChange, options, placeholder, disabled }) => (
                <div key={label} className="space-y-2">
                  <Label className="text-blue-200/80 text-sm font-medium">{label}</Label>
                  <Select onValueChange={onChange} value={value} disabled={disabled}>
                    <SelectTrigger className="h-11 rounded-xl border-white/15 text-white disabled:opacity-40" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }} className="text-white">
                      <SelectItem value="todos">{placeholder}</SelectItem>
                      {options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── KPI RESULTS ───────────────────────────────────────────── */}
        {hasCalculated && (
          <div className="space-y-4">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">📋 Resultados de Indicadores</p>
            {kpiGroups.map((group, groupIdx) => {
              const c = groupPalette[groupIdx % groupPalette.length];
              const emoji = groupEmojis[groupIdx % groupEmojis.length];
              const validKpis = group.kpis.filter(k => k.value !== null);
              if (validKpis.length === 0) return null;
              return (
                <section key={groupIdx} className={`rounded-3xl p-5 shadow-xl border ${c.border}`}
                  style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}>
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">{emoji}</span>
                    <h3 className={`${c.accent} text-sm font-bold uppercase tracking-widest`}>{group.title}</h3>
                  </div>
                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.kpis.map((kpi, kpiIdx) => {
                      if (kpi.value === null) return null;
                      const pct = kpi.isPercentage ? Math.min(Math.max(kpi.value, 0), 100) : null;
                      const valueColor = pct !== null
                        ? pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171"
                        : "#f8fafc";
                      const barColor = pct !== null
                        ? pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171"
                        : "";
                      return (
                        <div key={kpiIdx}
                          className="rounded-2xl p-4 transition-all hover:scale-[1.02] cursor-default"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                          <p className="text-white/45 text-xs font-medium mb-2 leading-tight">{kpi.title}</p>
                          <p className="text-3xl font-black leading-none mb-2" style={{ color: valueColor }}>
                            {kpi.isPercentage
                              ? `${kpi.value.toFixed(1)}%`
                              : kpi.value.toLocaleString('es-CO')}
                          </p>
                          {pct !== null && (
                            <div className="h-1.5 w-full rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.1)" }}>
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: barColor }} />
                            </div>
                          )}
                          <p className="text-white/25 text-xs leading-snug">{kpi.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ── EXPORT BUTTONS ────────────────────────────────────────── */}
        {hasCalculated && (
          <section className="rounded-3xl p-6 shadow-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">📤 Exportar Resultados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { id: "pdf",   label: "📄 Informe PDF",                                          onClick: handleGeneratePdf,            disabled: isLoading },
                { id: "masa",  label: isLoading ? "⏳ Generando..." : "📦 PDFs por IPS",          onClick: handleGeneratePdfsEnMasa,     disabled: isLoading || !ipsList.length },
                { id: "xlsx",  label: isLoading ? "⏳ Generando..." : "📊 Consolidado XLSX",      onClick: handleDownloadConsolidatedXls, disabled: isLoading || !hasCalculated },
                { id: "anual", label: isLoading ? "⏳ Generando..." : "📋 Informe Anual",  onClick: handleGenerateAnnualReport,   disabled: isLoading || !chartData || chartData.length === 0 },
              ].map(({ id, label, onClick, disabled }) => (
                <Button key={id} onClick={onClick} disabled={disabled} variant="outline"
                  className="h-12 rounded-xl font-semibold text-white border-white/15 transition-all hover:scale-[1.02] disabled:opacity-40"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  {label}
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* ── CONSOLIDADO ANUAL ───────────────────────────────────────── */}
        <section className="rounded-3xl p-6 shadow-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">📊 Herramientas Adicionales</p>
          <a href="/consolidado-anual">
            <button className="w-full h-12 rounded-xl font-semibold text-white transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              📋 Consolidado Anual por IPS
            </button>
          </a>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <footer className="text-center pb-6 pt-2">
          <p className="text-white/15 text-xs">Sistema de Indicadores Materno-Perinatales · Dusakawi EPSI · {new Date().getFullYear()}</p>
        </footer>

      </main>
    </div>
  );
}

    