"use server";
import { identifyPrevalentRiskFactors } from "@/ai/flows/identify-prevalent-risk-factors";

export async function getRiskFactors(data: string) {
  if (!data) {
    return { success: false, error: "No data provided for analysis." };
  }
  try {
    const result = await identifyPrevalentRiskFactors({ data });
    return { success: true, riskFactors: result.riskFactors };
  } catch (error) {
    console.error("AI analysis failed:", error);
    return { success: false, error: "Failed to analyze risk factors with AI. The model may be unavailable or the data format is incorrect." };
  }
}
