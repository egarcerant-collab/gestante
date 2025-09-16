'use server';
/**
 * @fileOverview Identifies prevalent risk factors among pregnant women in a dataset.
 *
 * - identifyPrevalentRiskFactors - A function that identifies and returns the most prevalent risk factors.
 * - IdentifyPrevalentRiskFactorsInput - The input type for the identifyPrevalentRiskFactors function.
 * - IdentifyPrevalentRiskFactorsOutput - The return type for the identifyPrevalentRiskFactors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPrevalentRiskFactorsInputSchema = z.object({
  data: z.string().describe('The dataset in CSV format.'),
});
export type IdentifyPrevalentRiskFactorsInput = z.infer<typeof IdentifyPrevalentRiskFactorsInputSchema>;

const IdentifyPrevalentRiskFactorsOutputSchema = z.object({
  riskFactors: z.array(z.string()).describe('A list of the most prevalent risk factors.'),
});
export type IdentifyPrevalentRiskFactorsOutput = z.infer<typeof IdentifyPrevalentRiskFactorsOutputSchema>;

export async function identifyPrevalentRiskFactors(input: IdentifyPrevalentRiskFactorsInput): Promise<IdentifyPrevalentRiskFactorsOutput> {
  return identifyPrevalentRiskFactorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPrevalentRiskFactorsPrompt',
  input: {
    schema: IdentifyPrevalentRiskFactorsInputSchema,
  },
  output: {
    schema: IdentifyPrevalentRiskFactorsOutputSchema,
  },
  prompt: `You are a data analyst tasked with identifying the most prevalent risk factors among pregnant women from the provided dataset.

  Analyze the following CSV data to determine the key risk factors significantly impacting the health of pregnant women. Only include risk factors that appear in at least 5% of the records. Focus on factors directly related to pregnancy complications or adverse outcomes, such as pre-existing conditions, lifestyle choices, and access to prenatal care.

  Dataset:
  {{data}}

  Based on your analysis, list the most prevalent risk factors:
  `, 
});

const identifyPrevalentRiskFactorsFlow = ai.defineFlow(
  {
    name: 'identifyPrevalentRiskFactorsFlow',
    inputSchema: IdentifyPrevalentRiskFactorsInputSchema,
    outputSchema: IdentifyPrevalentRiskFactorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
