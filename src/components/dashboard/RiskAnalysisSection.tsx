"use client";
import { useState, useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRiskFactors } from "@/actions/analysis";
import type { PatientData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BrainCircuit } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RiskAnalysisSectionProps {
  data: PatientData[];
  csvData: string;
}

const POSITIVE_VALUES = ['si', 'true', '1', 'positivo', 'reactivo'];

const countOccurrences = (data: PatientData[], columnFragment: string) => {
    let count = 0;
    const matchingHeaders = Object.keys(data[0]).filter(header => header.toLowerCase().includes(columnFragment.toLowerCase()));
    matchingHeaders.forEach(header => {
        data.forEach(row => {
            if (POSITIVE_VALUES.includes(String(row[header]).toLowerCase())) {
                count++;
            }
        });
    });
    return count;
}

export function RiskAnalysisSection({ data, csvData }: RiskAnalysisSectionProps) {
  const [riskFactorCounts, setRiskFactorCounts] = useState<{ name: string; count: number }[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyze = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getRiskFactors(csvData);

      if (result.success && result.riskFactors) {
        const counts = result.riskFactors.map(factor => {
          const count = countOccurrences(data, factor);
          return { name: factor, count };
        }).filter(item => item.count > 0);

        setRiskFactorCounts(counts.sort((a,b) => b.count - a.count));
      } else {
        setError(result.error || "An unknown error occurred during AI analysis.");
      }
      setIsLoading(false);
    };

    if (csvData && data) {
        analyze();
    }
  }, [csvData, data]);

  const chartConfig = useMemo(() => {
    if (!riskFactorCounts) return {};
    return Object.fromEntries(
        riskFactorCounts.map(item => [item.name, {label: item.name, color: "hsl(var(--primary))"}])
    );
  }, [riskFactorCounts]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <CardTitle>AI-Powered Risk Factor Analysis</CardTitle>
        </div>
        <CardDescription>
          Prevalent risk factors identified by GenAI from your dataset.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] flex flex-col justify-center">
        {isLoading && <Skeleton className="h-full w-full" />}
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {riskFactorCounts && riskFactorCounts.length > 0 && (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={riskFactorCounts} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                width={120}
                interval={0}
              />
              <XAxis dataKey="count" type="number" hide />
              <ChartTooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="count" name="Patient Count" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
        {riskFactorCounts && riskFactorCounts.length === 0 && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p>No significant risk factors were identified by the AI,</p>
                <p>or they could not be quantified from the data.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
