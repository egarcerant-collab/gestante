"use client";

import { useState } from 'react';
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcularNumeradorGinecologia, calcularDenominadorGinecologia } from '@/lib/kpi-helpers';

export default function KpiPage() {
  const [selectedFile, setSelectedFile] = useState<string>("");
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
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const cleanHeader = (h: string) =>
    String(h || "")
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  const calculateKpi = async () => {
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
    setHasCalculated(false);


    try {
      const response = await fetch(selectedFile);
      if (!response.ok) {
        throw new Error(`No se pudo encontrar el archivo en la ruta especificada. Status: ${response.status}`);
      }

      const data = await response.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

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

      if (!hasCalculated) {
        const allDepartments = [...new Set(jsonData.map(row => row[departmentHeaderRaw]).filter(Boolean))].sort();
        const allMunicipalities = [...new Set(jsonData.map(row => row[municipalityHeaderRaw]).filter(Boolean))].sort();
        setDepartments(allDepartments);
        setMunicipalities(allMunicipalities);
      }
      
      const filteredData = jsonData.filter(row => {
          const rowDept = row[departmentHeaderRaw];
          const rowMuni = row[municipalityHeaderRaw];
          const deptMatch = !selectedDepartment || rowDept === selectedDepartment;
          const muniMatch = !selectedMunicipality || rowMuni === selectedMunicipality;
          return deptMatch && muniMatch;
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
      setError(err.message || "Ocurrió un error al leer o procesar el archivo. Asegúrate de que el formato sea correcto y que las columnas necesarias existan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (value: string) => {
    setSelectedFile(value);
    setError(null);
    setHasCalculated(false);
    setDepartments([]);
    setMunicipalities([]);
    setSelectedDepartment("");
    setSelectedMunicipality("");
  };

  const handleFilterChange = () => {
     if (hasCalculated) {
      calculateKpi();
    }
  }

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
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Cálculo de Indicadores de Gestantes</CardTitle>
          <CardDescription>
            Calcula los indicadores de "Captación Oportuna" y "Gestantes en Control" desde un archivo Excel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="excel-file">Selecciona un archivo</Label>
              <Select onValueChange={handleFileChange} value={selectedFile}>
                <SelectTrigger id="excel-file">
                  <SelectValue placeholder="Elige un mes..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="/BASES/2025/JULIO.xlsx">Julio 2025</SelectItem>
                  <SelectItem value="/BASES/2025/JUNIO.xlsx">Junio 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasCalculated && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="department-filter">Departamento</Label>
                  <Select
                    onValueChange={(value) => setSelectedDepartment(value === 'todos' ? '' : value)}
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
                    onValueChange={(value) => setSelectedMunicipality(value === 'todos' ? '' : value)}
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
              </>
            )}
          </div>
          <Button onClick={calculateKpi} className="w-full" disabled={isLoading || !selectedFile}>
            {isLoading ? "Calculando..." : "Calcular Indicadores"}
          </Button>
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
        </CardFooter>
      </Card>
    </div>
  );
}
