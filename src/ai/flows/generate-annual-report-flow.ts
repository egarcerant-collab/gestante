'use server';
/**
 * @fileOverview Flujo de IA para generar un informe anual de gestión de riesgo en salud.
 *
 * - generateAnnualReport: Genera un análisis experto y proyecciones basadas en los KPIs anuales.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MonthlyKpiSchema = z.object({
  name: z.string().describe('Nombre del mes.'),
  'Captación Oportuna': z.number().describe('Porcentaje de captación oportuna para el mes.'),
  'Tamizaje VIH': z.number().describe('Porcentaje de tamizaje de VIH para el mes.'),
  'Tamizaje Sífilis': z.number().describe('Porcentaje de tamizaje de Sífilis para el mes.'),
  'Tamizaje Toxoplasma': z.number().describe('Porcentaje de tamizaje de Toxoplasma para el mes.'),
  'Tamizaje Hepatitis B': z.number().describe('Porcentaje de tamizaje de Hepatitis B para el mes.'),
  'Tamizaje Chagas': z.number().describe('Porcentaje de tamizaje de Chagas para el mes.'),
  'Ecografías': z.number().describe('Porcentaje de realización de ecografías para el mes.'),
  'Nutrición': z.number().describe('Porcentaje de consulta de nutrición para el mes.'),
  'Odontología': z.number().describe('Porcentaje de consulta de odontología para el mes.'),
});

const AnnualReportInputSchema = z.object({
  year: z.string().describe("Año de la vigencia que se está analizando."),
  monthlyData: z.array(MonthlyKpiSchema).describe("Datos de los indicadores de cada mes."),
  ips: z.string().optional().describe("Nombre de la IPS que se está analizando. Si no se provee, se asume un consolidado general."),
});

const AnnualReportOutputSchema = z.object({
  analysis: z.string().describe("Un análisis detallado en formato de texto (aproximadamente 3000 caracteres) sobre el desempeño anual, tendencias, proyecciones y recomendaciones estratégicas."),
});


const annualReportPrompt = ai.definePrompt({
  name: 'annualReportPrompt',
  input: { schema: AnnualReportInputSchema },
  output: { schema: AnnualReportOutputSchema },
  prompt: `
    Actúa como un experto en epidemiología clínica y gestión de salud pública, especializado en la evaluación de programas de salud materno-perinatal en Colombia. Tu tarea es redactar un análisis ejecutivo de aproximadamente 3000 caracteres sobre el desempeño de la entidad "Dusakawi EPSI" durante el año {{{year}}}.

    El análisis debe basarse exclusivamente en los siguientes datos mensuales de indicadores de gestión del riesgo para gestantes. Cada valor es el porcentaje de cumplimiento para ese mes.

    Datos de la vigencia {{{year}}} ({{#if ips}}para la IPS: {{{ips}}}{{else}}consolidado general{{/if}}):
    {{#each monthlyData}}
    - Mes: {{name}}
      - Captación Oportuna: {{toFixed 'Captación Oportuna' 2}}%
      - Tamizaje VIH: {{toFixed 'Tamizaje VIH' 2}}%
      - Tamizaje Sífilis: {{toFixed 'Tamizaje Sífilis' 2}}%
      - Tamizaje Toxoplasma: {{toFixed 'Tamizaje Toxoplasma' 2}}%
      - Tamizaje Hepatitis B: {{toFixed 'Tamizaje Hepatitis B' 2}}%
      - Tamizaje Chagas: {{toFixed 'Tamizaje Chagas' 2}}%
      - Ecografías: {{toFixed 'Ecografías' 2}}%
      - Nutrición: {{toFixed 'Nutrición' 2}}%
      - Odontología: {{toFixed 'Odontología' 2}}%
    {{/each}}

    Estructura del informe:
    1.  **Análisis General del Desempeño:** Inicia con una evaluación global del año. Identifica las principales fortalezas y debilidades observadas a lo largo del período. Menciona los indicadores con mejor y peor desempeño promedio.
    2.  **Análisis de Tendencias:** Describe las tendencias clave. ¿Hay indicadores que mejoran o empeoran consistentemente a lo largo de los meses? ¿Existen patrones estacionales (por ejemplo, caídas en ciertos meses)? Comenta sobre la estabilidad o volatilidad de los resultados.
    3.  **Focos Críticos de Intervención:** Basado en las tendencias, identifica 2-3 áreas que requieren atención prioritaria. Justifica por qué son críticas (bajo rendimiento persistente, tendencia a la baja, alto impacto en el riesgo).
    4.  **Proyecciones y Recomendaciones Estratégicas:** Proyecta el posible escenario para el cierre del año si las tendencias actuales continúan. Ofrece recomendaciones estratégicas, accionables y de alto nivel para la junta directiva o el equipo de gestión. Las recomendaciones deben ir más allá de "mejorar el indicador" y sugerir "cómo" (ej. "Implementar un sistema de alertas tempranas para gestantes que no asisten a tamizajes clave", "Realizar jornadas de búsqueda activa en los meses de menor captación histórica").

    El tono debe ser formal, objetivo y basado en datos, como se esperaría de un informe para la alta gerencia. Evita repetir los datos numéricos de forma excesiva; en su lugar, interprétalos.
  `,
  helpers: {
      toFixed: (value: number, digits: number) => value.toFixed(digits),
  }
});

const generateAnnualReportFlow = ai.defineFlow(
  {
    name: 'generateAnnualReportFlow',
    inputSchema: AnnualReportInputSchema,
    outputSchema: AnnualReportOutputSchema,
  },
  async (input) => {
    const { output } = await annualReportPrompt(input);
    if (!output) {
      throw new Error("No se pudo generar el informe anual en este momento.");
    }
    return output;
  }
);

export async function generateAnnualReport(input: z.infer<typeof AnnualReportInputSchema>): Promise<string> {
  const result = await generateAnnualReportFlow(input);
  return result.analysis;
}
