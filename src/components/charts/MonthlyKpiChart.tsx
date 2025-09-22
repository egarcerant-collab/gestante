"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell } from "recharts"

interface MonthlyKpiChartProps {
    data: {
        name: string;
        [key: string]: number | string;
    }[];
    dataKey: string;
    fillColor?: string;
}

const formatAsPercent = (tick: any) => `${tick}%`;

export function MonthlyKpiChart({ data, dataKey, fillColor }: MonthlyKpiChartProps) {
  return (
    <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatAsPercent} domain={[0, 100]} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))'
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, dataKey]}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={fillColor || "hsl(var(--chart-1))"} radius={[4, 4, 0, 0]} />
        </BarChart>
        </ResponsiveContainer>
    </div>
  )
}
