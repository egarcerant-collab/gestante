"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PatientData } from "@/lib/types";
import { ClipboardList } from "lucide-react";

interface PatientDataTableProps {
  data: PatientData[];
}

const columnsToShow = [
    { header: "ID", key: "No._De_Identificación" },
    { header: "First Name", key: "Nombre_1" },
    { header: "Last Name", key: "Apellido_1" },
    { header: "Age", key: "Edad_(años)" },
    { header: "Risk", key: "Clasificación_del_riesgo" },
];

export function PatientDataTable({ data }: PatientDataTableProps) {
  if (!data || data.length === 0) {
    return null;
  }
  const tableHeaders = Object.keys(data[0] || {});
  const validColumns = columnsToShow.filter(c => tableHeaders.includes(c.key));

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <CardTitle>Patient Data Preview</CardTitle>
        </div>
        <CardDescription>A preview of the records from your dataset.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                {validColumns.map(col => <TableHead key={col.key}>{col.header}</TableHead>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.slice(0,10).map((row, index) => (
                <TableRow key={index}>
                    {validColumns.map(col => <TableCell key={col.key}>{String(row[col.key] || '')}</TableCell>)}
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
         {data.length > 10 && <p className="text-sm text-muted-foreground mt-4">Showing first 10 of {data.length} records.</p>}
      </CardContent>
    </Card>
  );
}
