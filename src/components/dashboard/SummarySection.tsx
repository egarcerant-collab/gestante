"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PatientData } from "@/lib/types";
import { Users, AlertTriangle, Baby, FileText, RotateCcw, Stethoscope } from "lucide-react";
import { useMemo } from "react";

interface SummarySectionProps {
  data: PatientData[];
  fileName: string | null;
  onReset: () => void;
}

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export function SummarySection({ data, fileName, onReset }: SummarySectionProps) {
  const summary = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalPatients: 0, avgAge: "0", highRisk: 0, adolescent: 0, validUltrasounds: 0 };
    }

    const ageKey = "Edad_(años)";
    const riskKey = "Clasificación_del_riesgo";
    const ultrasoundKeys = [
        "ECOGRAFIA_OBSTETRICA_Ecografia_obstétrica_con_translucencia_nucal_(10,6_-_13,6)",
        "ECOGRAFIA_OBSTETRICA_Ecografia_Obstetrica_para_la_detección_de_anomalias_estructurales_(18_-_23)",
        "ECOGRAFIA_OBSTETRICA_Otras_ecografías?"
    ];

    let totalAge = 0;
    let validAgeCount = 0;
    let highRiskCount = 0;
    let adolescentCount = 0;
    let invalidUltrasoundCount = 0;

    data.forEach(patient => {
      const age = Number(patient[ageKey]);
      if (!isNaN(age)) {
        totalAge += age;
        validAgeCount++;
        if (age < 18) {
          adolescentCount++;
        }
      }
      if (String(patient[riskKey]).toLowerCase().includes('alto')) {
        highRiskCount++;
      }

      const isInvalid = ultrasoundKeys.every(key => 
        patient[key] && String(patient[key]).toLowerCase().includes('sin datos')
      );

      if(isInvalid) {
        invalidUltrasoundCount++;
      }
    });

    return {
      totalPatients: data.length,
      avgAge: validAgeCount > 0 ? (totalAge / validAgeCount).toFixed(1) : "N/A",
      highRisk: highRiskCount,
      adolescent: adolescentCount,
      validUltrasounds: data.length - invalidUltrasoundCount,
    };
  }, [data]);
  
  return (
    <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4" />
                    Analysis for: <span className="font-semibold text-foreground">{fileName || 'your data'}</span>
                </p>
            </div>
            <Button onClick={onReset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Analyze New File
            </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Patients" value={summary.totalPatients} icon={Users} />
            <StatCard title="High-Risk" value={summary.highRisk} icon={AlertTriangle} />
            <StatCard title="Adolescents (<18)" value={summary.adolescent} icon={Baby} />
            <StatCard title="Average Age" value={summary.avgAge} icon={Users} />
            <StatCard title="Valid Ultrasounds" value={summary.validUltrasounds} icon={Stethoscope} />
        </div>
    </div>
  );
}

