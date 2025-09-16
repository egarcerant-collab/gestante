"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { SummarySection } from "@/components/dashboard/SummarySection";
import { RiskAnalysisSection } from "@/components/dashboard/RiskAnalysisSection";
import { PatientDataTable } from "@/components/dashboard/PatientDataTable";
import type { PatientData } from "@/lib/types";
import { LoadingDashboard } from "@/components/dashboard/LoadingDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// Simplified CSV parser
// WARNING: This is a simplified CSV parser and may not handle all edge cases,
// such as commas within quoted fields. For production use, a more robust library is recommended.
function parseCsv(csvString: string): { data: PatientData[], error: string | null } {
  try {
    const lines = csvString.trim().split(/\r\n|\n/);
    if (lines.length < 2) {
      return { data: [], error: "CSV must have a header row and at least one data row." };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const jsonData: PatientData[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;

      const values = lines[i].split(',');
      
      const entry: PatientData = {};
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

export default function Home() {
  const [data, setData] = useState<PatientData[] | null>(null);
  const [csvString, setCsvString] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileParse = (file: File) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setCsvString(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { data: jsonData, error: parseError } = parseCsv(text);
        
        if (parseError) {
          throw new Error(parseError);
        }

        setData(jsonData);
        setCsvString(text);
        setError(null);
      } catch (err: any) {
        console.error("Error parsing file:", err);
        setError(err.message || "Failed to parse the file. Please ensure it's a valid CSV.");
        setData(null);
        setCsvString(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Error reading the file.");
      setIsLoading(false);
    }
    reader.readAsText(file, 'UTF-8');
  };

  const handleReset = () => {
    setData(null);
    setCsvString(null);
    setError(null);
    setFileName(null);
  }

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
              <AlertTitle>Processing Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && data && csvString && (
            <div className="animate-in fade-in-50 duration-500 space-y-6">
              <SummarySection data={data} fileName={fileName} onReset={handleReset} />
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3">
                  <RiskAnalysisSection data={data} csvData={csvString} />
                </div>
                <div className="xl:col-span-2">
                  <PatientDataTable data={data} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
