
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
      let captacionCount = 0;
      let controlCount = 0;

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
      });
      
      setKpiResult(captacionCount);
      setGestantesControlResult(controlCount);

      if (controlCount > 0) {
        setControlPercentageResult((captacionCount / controlCount) * 100);
      } else {
        setControlPercentageResult(0);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {gestantesControlResult !== null && (
               <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Resultado: Gestantes en Control</AlertTitle>
                  <AlertDescription>
                      <p className="text-2xl font-bold">{gestantesControlResult}</p>
                      <p className="text-sm text-muted-foreground">Total de gestantes registradas.</p>
                  </AlertDescription>
              </Alert>
            )}
            {kpiResult !== null && (
               <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Resultado: Captación Oportuna</AlertTitle>
                  <AlertDescription>
                      <p className="text-2xl font-bold">{kpiResult}</p>
                      <p className="text-sm text-muted-foreground">Gestantes con control antes de la semana 10.</p>
                  </AlertDescription>
              </Alert>
            )}
            {controlPercentageResult !== null && (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Control de Gestantes</AlertTitle>
                    <AlertDescription>
                        <p className="text-2xl font-bold">{controlPercentageResult.toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">Porcentaje de captación oportuna.</p>
                    </AlertDescription>
                </Alert>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
