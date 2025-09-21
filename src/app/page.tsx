
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal } from 'lucide-react';

declare var XLSX: any;

export default function KpiPage() {
  const [file, setFile] = useState<File | null>(null);
  const [kpiResult, setKpiResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cleanHeader = (h: string) => String(h || '').normalize("NFD").replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');

  const calculateKpi = async () => {
    if (!file) {
      setError("Por favor, selecciona un archivo de Excel para analizar.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setKpiResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true });

      const headerToFind = 'edad_gest_inicio_control';
      let count = 0;

      jsonData.forEach((row: any) => {
        const cleanedRow: { [key: string]: any } = {};
        for (const key in row) {
            cleanedRow[cleanHeader(key)] = row[key];
        }

        const value = cleanedRow[headerToFind];
        if (value !== undefined && typeof value === 'number' && value < 10) {
          count++;
        }
      });
      
      setKpiResult(count);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error al leer o procesar el archivo. Asegúrate de que el formato sea correcto y que la columna 'Edad_Gest_Inicio_Control' exista.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null); // Clear previous errors on new file selection
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cálculo de KPI: Captación Oportuna</CardTitle>
          <CardDescription>
            Calcula el número de gestantes con captación oportuna (Edad Gestacional de Inicio de Control &lt; 10) desde un archivo Excel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="excel-file">Archivo Excel</Label>
            <Input id="excel-file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          </div>
          <Button onClick={calculateKpi} className="w-full" disabled={isLoading || !file}>
            {isLoading ? "Calculando..." : "Calcular KPI"}
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
          {kpiResult !== null && (
             <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Resultado del KPI</AlertTitle>
                <AlertDescription>
                    <p className="text-2xl font-bold">Captación Oportuna: {kpiResult}</p>
                </AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
