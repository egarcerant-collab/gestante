
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileParse: (file: File) => void;
}

const ALLOWED_FILE_TYPES = [
    "text/csv", 
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];
const ALLOWED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];


export function FileUpload({ onFileParse }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  const validateAndSetFile = (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (ALLOWED_FILE_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(fileExtension)) {
       setFile(file);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a valid CSV, XLS, or XLSX file.",
      });
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleAnalyzeClick = () => {
    if (file) {
      setIsLoading(true);
      onFileParse(file);
    }
  };
  
  const triggerFileSelect = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  }

  return (
    <Card className="animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle>Upload Your Data</CardTitle>
        <CardDescription>
          Import a CSV, XLS, or XLSX file with patient data to begin analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg transition-colors ${!isLoading ? 'cursor-pointer hover:border-primary/50' : 'cursor-not-allowed'}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          <UploadCloud className="w-12 h-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">CSV, XLS, or XLSX files</p>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={isLoading}
          />
        </div>
        {file && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileIcon className="w-6 h-6 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={isLoading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <Button onClick={handleAnalyzeClick} disabled={!file || isLoading} className="w-full">
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : "Analyze Data"}
        </Button>
      </CardContent>
    </Card>
  );
}
