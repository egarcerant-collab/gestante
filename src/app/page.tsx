
"use client";

import { useState } from "react";
import * as XLSX from 'xlsx';
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { LoadingDashboard } from "@/components/dashboard/LoadingDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { QuoteTable } from "@/components/quote/QuoteTable";


export default function Home() {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileParse = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result;
        let jsonData: any[] | null = null;
        
        if (file.type === "application/json" || file.name.endsWith('.json')) {
            const json = JSON.parse(fileContent as string);
            if (!Array.isArray(json)) {
                throw new Error("JSON file must contain an array of objects.");
            }
            jsonData = json;
        } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
            const workbook = XLSX.read(fileContent, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json<any>(worksheet);
            jsonData = json;
        } else if (file.type === "text/csv" || file.name.endsWith('.csv')) {
            const workbook = XLSX.read(fileContent as string, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        } else {
            throw new Error("Unsupported file type. Please use CSV, XLS, XLSX, or JSON.");
        }

        if (jsonData) {
            setData(jsonData);
        } else {
            setData([]);
        }

        setError(null);
      } catch (err: any) {
        console.error("Error processing file:", err);
        setError(err.message || "Failed to parse the file. Please ensure it's a valid CSV, XLS, XLSX, or JSON file.");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Error reading the file.");
      setIsLoading(false);
    }
    
    if (file.type === "text/csv" || file.name.endsWith('.csv') || file.type === "application/json" || file.name.endsWith('.json')) {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          {isLoading && <LoadingDashboard />}

          {!isLoading && !data && (
            <div className="max-w-2xl mx-auto">
              <FileUpload onFileParse={handleFileParse} />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error de Procesamiento</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && data && (
            <div className="animate-in fade-in-50 duration-500 space-y-6">
               <div className="max-w-screen-2xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-center mb-4">Cotización Generada</h2>
                <QuoteTable items={data} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
