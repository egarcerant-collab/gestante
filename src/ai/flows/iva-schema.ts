/**
 * @fileOverview Schemas and types for the IVA checking flow.
 */

import { z } from 'zod';

export const IvaInputSchema = z.array(z.string());
export const IvaOutputSchema = z.object({
  results: z.array(z.object({
    hasIva: z.boolean().describe('Whether or not the product has IVA.'),
  }))
});

export type IvaInput = z.infer<typeof IvaInputSchema>;
export type IvaOutput = z.infer<typeof IvaOutputSchema>;
