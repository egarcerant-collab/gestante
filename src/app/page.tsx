
"use client";

import { useState } from "react";
import * as XLSX from 'xlsx';
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { LoadingDashboard } from "@/components/dashboard/LoadingDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { QuoteTable } from "@/components/quote/QuoteTable";
import { checkIva } from "@/ai/flows/iva-flow";

// Simplified CSV parser
// WARNING: This is a simplified CSV parser and may not handle all edge cases,
// such as commas within quoted fields. For a robust library, consider alternatives.
function parseCsv(csvString: string): { data: any[], error: string | null } {
  try {
    const lines = csvString.trim().split(/\r\n|\n/);
    if (lines.length < 2) {
      return { data: [], error: "CSV must have a header row and at least one data row." };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const jsonData: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;

      const values = lines[i].split(',');
      
      const entry: any = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = values[j] ? values[j].trim().replace(/"/g, '') : '';
        entry[header] = value;
      }
      jsonData.push(entry);
    }
    
    return { data: jsonData, error: null };
  } catch (err) {
    console.error("Error parsing CSV:", err);
    return { data: [], error: "An unexpected error occurred while parsing the file." };
  }
}

const processInBatches = async (items: any[], batchSize: number, delay: number) => {
    let results: any[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const descriptions = batch.map(item => item['DESCRIPCION'] || '');
        try {
            const ivaResults = await checkIva(descriptions);
            if (ivaResults.results.length !== batch.length) {
                // If a batch fails, we can decide to throw or mark items as failed
                throw new Error(`AI results mismatch in batch. Expected ${batch.length}, got ${ivaResults.results.length}`);
            }
            const enrichedBatch = batch.map((item, index) => {
                return { ...item, hasIva: ivaResults.results[index].hasIva };
            });
            results = results.concat(enrichedBatch);
        } catch (error) {
            console.error("Error processing batch:", error);
            // Mark batch items as failed to process
             const failedBatch = batch.map(item => ({ ...item, hasIva: false, error: 'AI processing failed' }));
             results = results.concat(failedBatch);
        }

        // Avoid hitting rate limits
        if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return results;
}


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
        let parseError: string | null = null;

        if (file.type === "application/json" || file.name.endsWith('.json')) {
            const json = JSON.parse(fileContent as string);
            if (!Array.isArray(json)) {
                throw new Error("JSON file must contain an array of objects.");
            }
            jsonData = json;
        } else if (file.type === "text/csv" || file.name.endsWith('.csv')) {
            const { data, error } = parseCsv(fileContent as string);
            jsonData = data;
            parseError = error;
        } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
            const workbook = XLSX.read(fileContent, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json<any>(worksheet);
            jsonData = json;
        } else {
            throw new Error("Unsupported file type.");
        }
        
        if (parseError) {
          throw new Error(parseError);
        }

        if (jsonData && jsonData.length > 0) {
            // Process in batches of 5 with a 2-second delay between batches
            const enrichedData = await processInBatches(jsonData, 5, 2000); 
            setData(enrichedData);
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
               <div className="max-w-4xl mx-auto">
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
