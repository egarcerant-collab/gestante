'use server';
/**
 * @fileOverview Flujo de IA para generar recomendaciones de gestión de riesgo en salud.
 *
 * - generateRecommendations: Genera recomendaciones basadas en KPIs de gestantes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { KpiResults } from '@/lib/types';

const KpiInputSchema = z.object({
  kpiResult: z.number().nullable().describe("Número de gestantes con captación oportuna (antes de la semana 10)."),
  gestantesControlResult: z.number().nullable().describe("Total de gestantes en control."),
  controlPercentageResult: z.number().nullable().describe("Porcentaje de captación oportuna sobre el total de gestantes en control."),
  resultadoTamizajeVihResult: z.number().nullable().describe("Porcentaje de gestantes con tamizaje de VIH completo."),
  resultadoTamizajeSifilisResult: z.number().nullable().describe("Porcentaje de gestantes con tamizaje de Sífilis completo."),
  resultadoToxoplasmaResult: z.number().nullable().describe("Porcentaje de gestantes con tamizaje de Toxoplasma válido."),
  resultadoTamizajeHbResult: z.number().nullable().describe("Porcentaje de gestantes con tamizaje de Hepatitis B válido."),
  resultadoChagasResult: z.number().nullable().describe("Porcentaje de gestantes con tamizaje de Chagas válido."),
  resultadoEcografiasResult: z.number().nullable().describe("Porcentaje de gestantes con ecografías válidas."),
  resultadoNutricionResult: z.number().nullable().describe("Porcentaje de gestantes con consulta de nutrición."),
  resultadoOdontologiaResult: z.number().nullable().describe("Porcentaje de gestantes con consulta de odontología."),
  porcentajeGinecologiaResult: z.number().nullable().describe("Porcentaje de cobertura de ginecología para gestantes de alto riesgo."),
});

const RecommendationsOutputSchema = z.object({
  recommendations: z.array(z.string()).describe("Una lista de recomendaciones accionables y específicas."),
});

const recommendationsPrompt = ai.definePrompt({
  name: 'recommendationsPrompt',
  input: { schema: KpiInputSchema },
  output: { schema: RecommendationsOutputSchema },
  prompt: `
    Eres un experto en auditoría y gestión de riesgos en salud para programas materno-perinatales en Colombia.
    Tu tarea es analizar los siguientes indicadores de desempeño (KPIs) de una IPS y generar una lista de 3 a 5 recomendaciones claras, específicas y accionables para mejorar los resultados.
    Basa tus recomendaciones únicamente en los datos proporcionados. Prioriza las áreas con los porcentajes de cumplimiento más bajos o que representen un mayor riesgo.

    Indicadores de la IPS:
    - Total de Gestantes en Control: {{{gestantesControlResult}}}
    - Porcentaje de Captación Oportuna (<10 sem): {{{controlPercentageResult}}}%
    - Porcentaje de Tamizaje para VIH: {{{resultadoTamizajeVihResult}}}%
    - Porcentaje de Tamizaje para Sífilis: {{{resultadoTamizajeSifilisResult}}}%
    - Porcentaje de Tamizaje para Toxoplasma: {{{resultadoToxoplasmaResult}}}%
    - Porcentaje de Tamizaje para Hepatitis B: {{{resultadoTamizajeHbResult}}}%
    - Porcentaje de Tamizaje para Chagas: {{{resultadoChagasResult}}}%
    - Porcentaje de Realización de Ecografías: {{{resultadoEcografiasResult}}}%
    - Porcentaje de Consulta de Nutrición: {{{resultadoNutricionResult}}}%
    - Porcentaje de Consulta de Odontología: {{{resultadoOdontologiaResult}}}%
    - Porcentaje de Cobertura de Ginecología (Alto Riesgo): {{{porcentajeGinecologiaResult}}}%

    Formato de salida: Devuelve un objeto JSON con una clave "recommendations" que contenga un array de strings.
    Ejemplo de recomendación: "Implementar jornadas de búsqueda activa comunitaria para mejorar el indicador de captación oportuna, actualmente en {{{controlPercentageResult}}}%."
  `,
});

const generateRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateRecommendationsFlow',
    inputSchema: KpiInputSchema,
    outputSchema: z.array(z.string()),
  },
  async (input) => {
    const { output } = await recommendationsPrompt(input);
    if (!output) {
      return ["No se pudieron generar recomendaciones en este momento."];
    }
    return output.recommendations;
  }
);

export async function generateRecommendations(input: KpiResults): Promise<string[]> {
  // Asegurarse de que los valores nulos se manejen si es necesario, aquí se pasan como están.
  return generateRecommendationsFlow(input);
}
