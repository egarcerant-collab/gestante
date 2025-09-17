
'use server';
/**
 * @fileOverview Flow to determine if a product has IVA in Colombia.
 *
 * - checkIva - A function that calls the AI to check for IVA.
 */

import { ai } from '@/ai/genkit';
import { IvaInput, IvaInputSchema, IvaOutput, IvaOutputSchema } from './iva-schema';


export async function checkIva(productDescription: IvaInput): Promise<IvaOutput> {
  return ivaFlow(productDescription);
}

const ivaFlow = ai.defineFlow(
  {
    name: 'ivaFlow',
    inputSchema: IvaInputSchema,
    outputSchema: IvaOutputSchema,
  },
  async (productDescription) => {
    const prompt = `
      Eres un experto en impuestos de Colombia.
      Basado en la siguiente descripción de producto, determina si está sujeto a IVA en Colombia.
      La tarifa general de IVA es del 19%. Algunos productos de la canasta familiar están exentos.
      Responde únicamente con un objeto JSON con la clave "hasIva" y un valor booleano.
      Descripción del producto: "${productDescription}"
    `;

    const { output } = await ai.generate({
      prompt: prompt,
      output: {
        schema: IvaOutputSchema,
      },
    });
    return output!;
  }
);
