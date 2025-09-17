
'use server';
/**
 * @fileOverview Flow to determine if a product has IVA in Colombia.
 *
 * - checkIva - A function that calls the AI to check for IVA.
 */

import { ai } from '@/ai/genkit';
import { IvaInput, IvaInputSchema, IvaOutput, IvaOutputSchema } from './iva-schema';


export async function checkIva(productDescriptions: IvaInput): Promise<IvaOutput> {
  return ivaFlow(productDescriptions);
}

const ivaFlow = ai.defineFlow(
  {
    name: 'ivaFlow',
    inputSchema: IvaInputSchema,
    outputSchema: IvaOutputSchema,
  },
  async (productDescriptions) => {
    const prompt = `
      Eres un experto en impuestos de Colombia.
      Basado en la siguiente lista de descripciones de productos, determina para cada uno si está sujeto a IVA en Colombia.
      La tarifa general de IVA es del 19%. Algunos productos de la canasta familiar están exentos.
      Responde únicamente con un objeto JSON que contenga una clave "results", cuyo valor sea un array de objetos. Cada objeto en el array debe tener la clave "hasIva" y un valor booleano.
      El array de respuesta debe tener el mismo orden y número de elementos que la lista de productos de entrada.

      Descripciones de productos:
      ${productDescriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}
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
