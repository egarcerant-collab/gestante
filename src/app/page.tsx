
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal } from 'lucide-react';

declare var XLSX: any;

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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cleanHeader = (h: string) => String(h || '').normalize("NFD").replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');

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


    try {
      const response = await fetch(selectedFile);
      if (!response.ok) {
        throw new Error(`No se pudo encontrar el archivo en la ruta especificada. Status: ${response.status}`);
      }

      const data = await response.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true });

      const captacionHeader = 'edad_gest_inicio_control';
      const controlHeader = 'no_de_identificacion';
      const vih1Header = 'pruebas_de_tamizaje_para_vih_resultado_primer_tamizaje_prueba_de_vih_';
      const vih2Header = 'resultado_segundo_tamizaje_prueba_de_vih';
      const vih3Header = 'pruebas_de_tamizaje_para_vih_fecha_toma_prueba_vih_tercer_tamizaje';
      const sifilis1Header = 'pruebas_de_tamizaje_para_sifilis_resultado_primera_prueba_treponemica_rapida_sifilis';
      const sifilis2Header = 'pruebas_de_tamizaje_para_sifilis_resultado_segunda_prueba_treponemica_rapida_sifilis';
      const sifilis3Header = 'pruebas_de_tamizaje_para_sifilis_resultado_tercera_prueba_treponemica_rapida_sifilis';
      const toxoplasmaHeader = 'toxoplasma_igg__igm_resultado_toxoplasma';
      const hbResultadoHeader = 'antigeno_de_hepatitis_b_resultado_antigeno_superficie_hepatitis_b';
      const hbFechaHeader = 'antigeno_de_hepatitis_b_fecha_de_antigeno_superficie__hepatitis_b';
      const chagasHeader = 'chagas_resultado_chagas';
      const eco1Header = 'ecografia_obstetrica_ecografia_obstetrica_con_translucencia_nucal_106__136';
      const eco2Header = 'ecografia_obstetrica_ecografia_obstetrica_para_la_deteccion_de_anomalias_estructurales_18__23';
      const eco3Header = 'ecografia_obstetrica_otras_ecografias';
      const nutricionHeader = 'atencion_especializada_escriba_las_fechas_ddmmaa_de_consultas_realizadas_por_especialistas_fecha_consulta_nutricion';
      const odontologiaHeader = 'fecha_consulta_odontologica';
      const ginecologiaHeader = 'atencion_especializada_escriba_las_fechas_ddmmaa_de_consultas_realizadas_por_especialistas_fecha_primera_consulta_ginecologia';
      const riesgoHeader = 'clasificacion_del_riesgo';


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
      let ginecologiaCount = 0;
      const totalRegistros = jsonData.length;


      jsonData.forEach((row: any) => {
        const cleanedRow: { [key: string]: any } = {};
        for (const key in row) {
            cleanedRow[cleanHeader(key)] = row[key];
        }

        // KPI "Gestantes en Control"
        const controlValue = cleanedRow[controlHeader];
        if (controlValue !== undefined && controlValue !== "") {
            controlCount++;
        }
        
        // KPI "Captación Oportuna"
        const captacionValue = cleanedRow[captacionHeader];
        if (captacionValue !== undefined && typeof captacionValue === 'number' && captacionValue < 10) {
          captacionCount++;
        }

        // KPI "Examenes_VIH_Completos"
        const vih1Value = String(cleanedRow[vih1Header] || '').toLowerCase();
        const vih2Value = String(cleanedRow[vih2Header] || '').toLowerCase();
        const vih3Value = String(cleanedRow[vih3Header] || '').toLowerCase();

        if (vih1Value.includes("sin datos") && vih2Value.includes("sin datos") && vih3Value.includes("sin datos")) {
          sinDatosVihCount++;
        }

        // KPI "Examenes_Sifilis_Completos"
        const sif1Value = String(cleanedRow[sifilis1Header] || '').toLowerCase().trim();
        const sif2Value = String(cleanedRow[sifilis2Header] || '').toLowerCase().trim();
        const sif3Value = String(cleanedRow[sifilis3Header] || '').toLowerCase().trim();
        
        if (sif1Value.includes("sin datos") && sif2Value.includes("sin datos") && sif3Value.includes("sin datos")) {
            sinDatosSifilisCount++;
        }

        // KPI "Toxoplasma_Validos"
        const toxoplasmaValue = String(cleanedRow[toxoplasmaHeader] || '').toLowerCase().trim();
        if (toxoplasmaValue.includes("sin datos")) {
            sinDatosToxoplasmaCount++;
        }

        // KPI "Examenes_HB_Completos"
        const hbResultadoValue = String(cleanedRow[hbResultadoHeader] || '').toLowerCase().trim();
        const hbFechaValue = cleanedRow[hbFechaHeader];
        if (hbResultadoValue.includes("sin datos") && (hbFechaValue !== undefined && hbFechaValue !== "")) {
            sinDatosHbCount++;
        }

        // KPI "Chagas_Resultados_Validos"
        const chagasValue = String(cleanedRow[chagasHeader] || '').toLowerCase().trim();
        if (chagasValue.includes("sin datos")) {
            sinDatosChagasCount++;
        }

        // KPI "Ecografias_Obstetricas_Validas"
        const eco1Value = String(cleanedRow[eco1Header] || '').toLowerCase().trim();
        const eco2Value = String(cleanedRow[eco2Header] || '').toLowerCase().trim();
        const eco3Value = String(cleanedRow[eco3Header] || '').toLowerCase().trim();
        if (eco1Value.includes("sin datos") && eco2Value.includes("sin datos") && eco3Value.includes("sin datos")) {
            sinDatosEcografiaCount++;
        }

        // KPI "Nutricion"
        const nutricionValue = String(cleanedRow[nutricionHeader] || '').toLowerCase().trim();
        if (nutricionValue.includes("sin datos")) {
            sinDatosNutricionCount++;
        }

        // KPI "Odontologia"
        const odontologiaValue = String(cleanedRow[odontologiaHeader] || '').toLowerCase().trim();
        if (odontologiaValue.includes("sin datos")) {
            sinDatosOdontologiaCount++;
        }

        // KPI "Numerador Ginecologia"
        const ginecologiaValue = String(cleanedRow[ginecologiaHeader] || '').toLowerCase().trim();
        const riesgoValue = String(cleanedRow[riesgoHeader] || '');
        const invalidGinecoValues = ["sin dato", "sin datos", "si datos"];

        if (riesgoValue === "Alto Riesgo Obstétrico" && 
            ginecologiaValue && 
            !invalidGinecoValues.includes(ginecologiaValue)) {
            ginecologiaCount++;
        }
      });
      
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

      setGinecologiaResult(ginecologiaCount);

      setKpiResult(captacionCount);
      setGestantesControlResult(controlCount);

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
  };

  const kpiGroups = [
    {
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Captación Oportuna", value: kpiResult, description: "Gestantes con control antes de la semana 10." },
        { title: "Control de Gestantes", value: controlPercentageResult, isPercentage: true, description: "Porcentaje de control." },
      ]
    },
    {
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Exámenes VIH Completos", value: examenesVihCompletosResult, description: "Gestantes con al menos 1 tamizaje VIH." },
        { title: "Resultado Tamizaje VIH", value: resultadoTamizajeVihResult, isPercentage: true, description: "Porcentaje de tamizaje VIH." },
      ]
    },
    {
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Exámenes Sífilis Completos", value: examenesSifilisCompletosResult, description: "Gestantes con al menos 1 tamizaje Sífilis." },
        { title: "Resultado Tamizaje Sífilis", value: resultadoTamizajeSifilisResult, isPercentage: true, description: "Porcentaje de tamizaje Sífilis." },
      ]
    },
    {
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Toxoplasma Válidos", value: toxoplasmaValidosResult, description: "Gestantes con tamizaje Toxoplasma válido." },
        { title: "Resultado de Toxoplasma", value: resultadoToxoplasmaResult, isPercentage: true, description: "Porcentaje de tamizaje Toxoplasma." },
      ]
    },
    {
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Exámenes HB Completos", value: examenesHbCompletosResult, description: "Gestantes con tamizaje Hepatitis B válido." },
        { title: "Resultado Tamizaje HB", value: resultadoTamizajeHbResult, isPercentage: true, description: "Porcentaje de tamizaje Hepatitis B." },
      ]
    },
    {
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Chagas Resultados Válidos", value: chagasResultadosValidosResult, description: "Gestantes con tamizaje de Chagas válido." },
        { title: "Resultado Chagas", value: resultadoChagasResult, isPercentage: true, description: "Porcentaje de tamizaje de Chagas." },
      ]
    },
    {
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Ecografías Válidas", value: ecografiasValidasResult, description: "Gestantes con ecografías válidas." },
        { title: "Resultado Ecografías", value: resultadoEcografiasResult, isPercentage: true, description: "Porcentaje de ecografías." },
      ]
    },
    {
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Nutrición", value: nutricionResult, description: "Gestantes con consulta de nutrición." },
        { title: "Resultado Nutrición", value: resultadoNutricionResult, isPercentage: true, description: "Porcentaje de consulta de nutrición." },
      ]
    },
     {
      kpis: [
        { title: "Gestantes en Control", value: gestantesControlResult, description: "Total de gestantes registradas." },
        { title: "Odontología", value: odontologiaResult, description: "Gestantes con consulta de odontología." },
        { title: "Resultado Odontología", value: resultadoOdontologiaResult, isPercentage: true, description: "Porcentaje de consulta de odontología." },
      ]
    }
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Cálculo de KPIs de Gestantes</CardTitle>
          <CardDescription>
            Calcula los KPIs de "Captación Oportuna" y "Gestantes en Control" desde un archivo Excel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
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
          <Button onClick={calculateKpi} className="w-full" disabled={isLoading || !selectedFile}>
            {isLoading ? "Calculando..." : "Calcular KPIs"}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {kpiGroups.map((group, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {group.kpis.map((kpi, kpiIndex) => {
                if (kpi.value === null) return null;
                return (
                  <Alert key={kpiIndex}>
                    <Terminal className="h-4 w-4" />
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
          ))}

           {ginecologiaResult !== null && (
               <div className="mt-4 w-full">
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Numerador Ginecología</AlertTitle>
                    <AlertDescription>
                        <p className="text-2xl font-bold">{ginecologiaResult}</p>
                        <p className="text-sm text-muted-foreground">Gestantes de alto riesgo con consulta de ginecología válida.</p>
                    </AlertDescription>
                </Alert>
               </div>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
