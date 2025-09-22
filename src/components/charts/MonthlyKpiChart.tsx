"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"

interface MonthlyKpiChartProps {
    data: {
        name: string;
        'Gestantes en Control': number;
        'Captación Oportuna': number;
    }[];
}

export function MonthlyKpiChart({ data }: MonthlyKpiChartProps) {
  return (
    <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))'
                }}
            />
            <Legend />
            <Bar dataKey="Gestantes en Control" fill="hsl(var(--chart-1))" />
            <Bar dataKey="Captación Oportuna" fill="hsl(var(--chart-2))" />
        </BarChart>
        </ResponsiveContainer>
    </div>
  )
}
