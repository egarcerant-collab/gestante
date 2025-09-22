"use client";

import { useState, useEffect } from 'react';
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcularNumeradorGinecologia, calcularDenominadorGinecologia } from '@/lib/kpi-helpers';
import { generarInformePDF, InformeDatos, PdfImages } from '@/lib/informe-riesgo-pdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { KpiResults } from '@/lib/types';
import { generateRecommendations } from '@/ai/flows/generate-recommendations-flow';


const availableFiles: Record<string, { name: string; path: string }[]> = {
    "2024": [
      { name: "Enero", path: "/BASES/2024/ENERO.xlsx" },
      { name: "Febrero", path: "/BASES/2024/FEBRERO.xlsx" },
      { name: "Marzo", path: "/BASES/2024/MARZO.xlsx" },
      { name: "Abril", path: "/BASES/2024/ABRIL.xlsx" },
      { name: "Mayo", path: "/BASES/2024/MAYO.xlsx" }
    ],
    "2025": [
      { name: "Enero", path: "/BASES/2025/ENERO.xlsx" },
      { name: "Febrero", path: "/BASES/2025/FEBRERO.xlsx" },
      { name: "Marzo", path: "/BASES/2025/MARZO.xlsx" }
    ]
  };

export default function KpiPage() {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [months, setMonths] = useState<{ name: string; path: string }[]>([]);

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
    if (isInitialRun) {
      setHasCalculated(false);
    }

    try {
      let jsonData: any[] = allData;

      if (isInitialRun || allData.length === 0) {
        const response = await fetch(selectedFile);
        if (!response.ok) {
          throw new Error(`No se pudo encontrar el archivo en la ruta especificada. Status: ${response.status}`);
        }
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
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
          const dept = String(row[departmentHeaderRaw] || '').trim().toUpperCase();
          const muni = String(row[municipalityHeaderRaw] || '').trim().toUpperCase();
          const ips = String(row[ipsHeaderRaw] || '').trim().toUpperCase();
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
          const rowDept = String(row[departmentHeaderRaw] || '').trim().toUpperCase();
          const rowMuni = String(row[municipalityHeaderRaw] || '').trim().toUpperCase();
          const rowIps = String(row[ipsHeaderRaw] || '').trim().toUpperCase();
          
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
      const toxoplasmaHeader = pickHeader(firstClean, ["toxoplasma"]);
      const hbResultadoHeader = pickHeader(firstClean, ["hepatitis", "b", "resultado"]);
      const hbFechaHeader = pickHeader(firstClean, ["hepatitis", "b", "fecha"]);
      const chagasHeader = pickHeader(firstClean, ["chagas"]);
      const eco1Header = pickHeader(firstClean, ["ecografia", "translucencia"]);
      const eco2Header = pickHeader(firstClean, ["ecografia", "anomalias"]);
      const eco3Header = pickHeader(firstClean, ["ecografia", "otras"]);
      const nutricionHeader = pickHeader(firstClean, ["nutricion"]);
      const odontologiaHeader = pickHeader(firstClean, ["odontolog"]);
      
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
      setGinecologiaResult(numeradorGinecologia);

      const denominadorGinecologia = calcularDenominadorGinecologia(filteredData);
      setDenominadorGinecologiaResult(denominadorGinecologia);

      if (denominadorGinecologia > 0) {
        setPorcentajeGinecologiaResult((numeradorGinecologia / denominadorGinecologia) * 100);
      } else {
        setPorcentajeGinecologiaResult(0);
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

        const vih1Value = String(cleanedRow[vih1Header] || '').toLowerCase();
        const vih2Value = String(cleanedRow[vih2Header] || '').toLowerCase();
        const vih3Value = String(cleanedRow[vih3Header] || '').toLowerCase();
        if (vih1Value.includes("sin datos") && vih2Value.includes("sin datos") && vih3Value.includes("sin datos")) {
          sinDatosVihCount++;
        }

        const sif1Value = String(cleanedRow[sifilis1Header] || '').toLowerCase().trim();
        const sif2Value = String(cleanedRow[sifilis2Header] || '').toLowerCase().trim();
        const sif3Value = String(cleanedRow[sifilis3Header] || '').toLowerCase().trim();
        if (sif1Value.includes("sin datos") && sif2Value.includes("sin datos") && sif3Value.includes("sin datos")) {
            sinDatosSifilisCount++;
        }

        const toxoplasmaValue = String(cleanedRow[toxoplasmaHeader] || '').toLowerCase().trim();
        if (toxoplasmaValue.includes("sin datos")) {
            sinDatosToxoplasmaCount++;
        }

        const hbResultadoValue = String(cleanedRow[hbResultadoHeader] || '').toLowerCase().trim();
        const hbFechaValue = cleanedRow[hbFechaHeader];
        if (hbResultadoValue.includes("sin datos") && !(hbFechaValue === undefined || hbFechaValue === "")) {
            sinDatosHbCount++;
        }

        const chagasValue = String(cleanedRow[chagasHeader] || '').toLowerCase().trim();
        if (chagasValue.includes("sin datos")) {
            sinDatosChagasCount++;
        }

        const eco1Value = String(cleanedRow[eco1Header] || '').toLowerCase().trim();
        const eco2Value = String(cleanedRow[eco2Header] || '').toLowerCase().trim();
        const eco3Value = String(cleanedRow[eco3Header] || '').toLowerCase().trim();
        if (eco1Value.includes("sin datos") && eco2Value.includes("sin datos") && eco3Value.includes("sin datos")) {
            sinDatosEcografiaCount++;
        }

        const nutricionValue = String(cleanedRow[nutricionHeader] || '').toLowerCase().trim();
        if (nutricionValue.includes("sin datos")) {
            sinDatosNutricionCount++;
        }

        const odontologiaValue = String(cleanedRow[odontologiaHeader] || '').toLowerCase().trim();
        if (odontologiaValue.includes("sin datos")) {
            sinDatosOdontologiaCount++;
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
    setMonths(availableFiles[year] || []);
    setSelectedFile(""); // Reset month selection
    resetAll();
  };

  const handleFileChange = (value: string) => {
    setSelectedFile(value);
    resetAll();
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
  }
  
  const prepararDatosParaPdf = (kpiData: KpiResults, ips: string, recomendacionesAI?: string[]): InformeDatos => {
    return {
        encabezado: {
            proceso: "Seguimiento a la Gestión del Riesgo en Salud",
            formato: "Informe de Evaluación de Indicadores",
            entidad: ips,
            vigencia: selectedFile.split('/').pop()?.split('.')[0] || 'N/A',
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
        const imageResponse = await fetch('/imagenes/IMAGENEN UNIFICADA.jpg');
        const imageBlob = await imageResponse.blob();
        const reader = new FileReader();
        reader.readAsDataURL(imageBlob);
        reader.onloadend = async () => {
            const base64data = reader.result;
            const images: PdfImages = { background: base64data as string };

            const aiRecommendations = await generateRecommendations(currentKpiData);
            const datosParaPdf = prepararDatosParaPdf(currentKpiData, selectedIps || "Consolidado General", aiRecommendations);
            await generarInformePDF(datosParaPdf, images);
        };

    } catch (error) {
        console.error("Error generando el informe:", error);
        setError("Error al cargar la imagen de fondo o generar las recomendaciones. Usando valores por defecto.");
        const datosParaPdf = prepararDatosParaPdf(currentKpiData, selectedIps || "Consolidado General");
        await generarInformePDF(datosParaPdf, undefined);
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

    let backgroundImage: string | undefined;
    try {
        const imageResponse = await fetch('/imagenes/IMAGENEN UNIFICADA.jpg');
        const imageBlob = await imageResponse.blob();
        backgroundImage = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageBlob);
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    } catch(e) {
        console.error("No se pudo cargar la imagen de fondo", e);
        setError("No se pudo cargar la imagen de fondo para los PDFs.");
    }
    
    const images: PdfImages | undefined = backgroundImage ? { background: backgroundImage } : undefined;

    for (const ips of ipsList) {
        const kpiDataForIps = await calculateKpiForFilter('', '', ips); 
        
        try {
            const aiRecommendations = await generateRecommendations(kpiDataForIps);
            const datosParaPdf = prepararDatosParaPdf(kpiDataForIps, ips, aiRecommendations);
            const blob = await generarInformePDF(datosParaPdf, images, '', true);

            if (blob) {
                const fileName = `Informe_Riesgo_${ips.replace(/\s/g, '_')}.pdf`;
                zip.file(fileName, blob);
            }
        } catch (aiError) {
            console.error(`Error generando recomendaciones de IA para ${ips}:`, aiError);
            const datosParaPdf = prepararDatosParaPdf(kpiDataForIps, ips);
            const blob = await generarInformePDF(datosParaPdf, images, '', true);
            if (blob) {
                const fileName = `Informe_Riesgo_${ips.replace(/\s/g, '_')}_sin_IA.pdf`;
                zip.file(fileName, blob);
            }
        }
    }

    zip.generateAsync({ type: "blob" }).then(content => {
        saveAs(content, `Informes_por_IPS_${new Date().toISOString().slice(0,10)}.zip`);
    });

    setIsLoading(false);
  };


  const calculateKpiForFilter = async (department: string, municipality: string, ips: string): Promise<KpiResults> => {
    return new Promise<KpiResults>(resolve => {
        const pickHeader = (rowObj: Record<string, any>, includes: string[]) => {
            const keys = Object.keys(rowObj);
            return keys.find(k => includes.every(frag => k.includes(frag))) || "";
        };

        const firstClean: any = {};
        const originalHeaders: Record<string, string> = {};
        for (const k in allData[0]) {
            const cleanedK = cleanHeader(k);
            firstClean[cleanedK] = allData[0][k];
            originalHeaders[cleanedK] = k;
        }

        const departmentHeaderRaw = originalHeaders[pickHeader(firstClean, ["departamento_residencia"])];
        const municipalityHeaderRaw = originalHeaders[pickHeader(firstClean, ["municipio_de_residencia"])];
        const ipsHeaderRaw = originalHeaders[pickHeader(firstClean, ["nombre", "ips", "primaria"])];


        const filteredData = allData.filter(row => {
            const rowDept = String(row[departmentHeaderRaw] || '').trim().toUpperCase();
            const rowMuni = String(row[municipalityHeaderRaw] || '').trim().toUpperCase();
            const rowIps = String(row[ipsHeaderRaw] || '').trim().toUpperCase();

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
        const toxoplasmaHeader = pickHeader(firstClean, ["toxoplasma"]);
        const hbResultadoHeader = pickHeader(firstClean, ["hepatitis", "b", "resultado"]);
        const hbFechaHeader = pickHeader(firstClean, ["hepatitis", "b", "fecha"]);
        const chagasHeader = pickHeader(firstClean, ["chagas"]);
        const eco1Header = pickHeader(firstClean, ["ecografia", "translucencia"]);
        const eco2Header = pickHeader(firstClean, ["ecografia", "anomalias"]);
        const eco3Header = pickHeader(firstClean, ["ecografia", "otras"]);
        const nutricionHeader = pickHeader(firstClean, ["nutricion"]);
        const odontologiaHeader = pickHeader(firstClean, ["odontolog"]);
        
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

          const vih1Value = String(cleanedRow[vih1Header] || '').toLowerCase();
          const vih2Value = String(cleanedRow[vih2Header] || '').toLowerCase();
          const vih3Value = String(cleanedRow[vih3Header] || '').toLowerCase();
          if (vih1Value.includes("sin datos") && vih2Value.includes("sin datos") && vih3Value.includes("sin datos")) {
            sinDatosVihCount++;
          }

          const sif1Value = String(cleanedRow[sifilis1Header] || '').toLowerCase().trim();
          const sif2Value = String(cleanedRow[sifilis2Header] || '').toLowerCase().trim();
          const sif3Value = String(cleanedRow[sifilis3Header] || '').toLowerCase().trim();
          if (sif1Value.includes("sin datos") && sif2Value.includes("sin datos") && sif3Value.includes("sin datos")) {
              sinDatosSifilisCount++;
          }

          const toxoplasmaValue = String(cleanedRow[toxoplasmaHeader] || '').toLowerCase().trim();
          if (toxoplasmaValue.includes("sin datos")) {
              sinDatosToxoplasmaCount++;
          }

          const hbResultadoValue = String(cleanedRow[hbResultadoHeader] || '').toLowerCase().trim();
          const hbFechaValue = cleanedRow[hbFechaHeader];
          if (hbResultadoValue.includes("sin datos") && !(hbFechaValue === undefined || hbFechaValue === "")) {
              sinDatosHbCount++;
          }

          const chagasValue = String(cleanedRow[chagasHeader] || '').toLowerCase().trim();
          if (chagasValue.includes("sin datos")) {
              sinDatosChagasCount++;
          }

          const eco1Value = String(cleanedRow[eco1Header] || '').toLowerCase().trim();
          const eco2Value = String(cleanedRow[eco2Header] || '').toLowerCase().trim();
          const eco3Value = String(cleanedRow[eco3Header] || '').toLowerCase().trim();
          if (eco1Value.includes("sin datos") && eco2Value.includes("sin datos") && eco3Value.includes("sin datos")) {
              sinDatosEcografiaCount++;
          }

          const nutricionValue = String(cleanedRow[nutricionHeader] || '').toLowerCase().trim();
          if (nutricionValue.includes("sin datos")) {
              sinDatosNutricionCount++;
          }

          const odontologiaValue = String(cleanedRow[odontologiaHeader] || '').toLowerCase().trim();
          if (odontologiaValue.includes("sin datos")) {
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
    }
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle>Cálculo de Indicadores de Gestantes</CardTitle>
          <CardDescription>
            Calcula los indicadores de "Captación Oportuna" y "Gestantes en Control" desde un archivo Excel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="year-selector">Selecciona un año</Label>
              <Select onValueChange={handleYearChange} value={selectedYear}>
                <SelectTrigger id="year-selector">
                  <SelectValue placeholder="Elige un año..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(availableFiles).map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="excel-file">Selecciona un mes</Label>
              <Select onValueChange={handleFileChange} value={selectedFile} disabled={!selectedYear}>
                <SelectTrigger id="excel-file">
                  <SelectValue placeholder="Elige un mes..." />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.path} value={month.path}>{month.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasCalculated && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="department-filter">Departamento</Label>
                  <Select
                    onValueChange={handleDepartmentChange}
                    value={selectedDepartment}
                    disabled={departments.length === 0}
                  >
                    <SelectTrigger id="department-filter">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="municipality-filter">Municipio</Label>
                  <Select
                    onValueChange={handleMunicipalityChange}
                    value={selectedMunicipality}
                    disabled={municipalities.length === 0}
                  >
                    <SelectTrigger id="municipality-filter">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {municipalities.map(muni => (
                        <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ips-filter">IPS Primaria</Label>
                  <Select
                    onValueChange={handleIpsChange}
                    value={selectedIps}
                    disabled={ipsList.length === 0}
                  >
                    <SelectTrigger id="ips-filter">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {ipsList.map(ips => (
                        <SelectItem key={ips} value={ips}>{ips}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={() => calculateKpi(true)} className="w-full" disabled={isLoading || !selectedFile}>
              {isLoading ? "Calculando..." : "Calcular Indicadores"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {hasCalculated && kpiGroups.map((group, index) => (
             <div key={index} className="w-full">
              {group.title && <h3 className="text-lg font-semibold mb-2">{group.title}</h3>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {group.kpis.map((kpi, kpiIndex) => {
                  if (kpi.value === null) return null;
                  return (
                    <Alert key={kpiIndex}>
                      <AlertTitle>{kpi.title}</AlertTitle>
                      <AlertDescription>
                        <p className="text-2xl font-bold">
                          {kpi.isPercentage ? `${kpi.value.toFixed(2)}%` : kpi.value}
                        </p>
                        <p className="text-sm text-muted-foreground">{kpi.description}</p>
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            </div>
          ))}
          {hasCalculated && (
              <div className="w-full mt-4 flex flex-col md:flex-row gap-4">
                <Button onClick={handleGeneratePdf} className="flex-1" variant="outline" disabled={isLoading}>
                    Generar Informe PDF (Actual)
                </Button>
                <Button onClick={handleGeneratePdfsEnMasa} className="flex-1" variant="outline" disabled={isLoading || !ipsList.length}>
                    {isLoading ? "Generando..." : "Generar Informes por IPS (En Masa)"}
                </Button>
            </div>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}

    