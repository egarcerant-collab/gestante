export type PatientData = Record<string, string | number>;

export interface KpiResults {
    kpiResult: number | null;
    gestantesControlResult: number | null;
    controlPercentageResult: number | null;
    examenesVihCompletosResult: number | null;
    resultadoTamizajeVihResult: number | null;
    examenesSifilisCompletosResult: number | null;
    resultadoTamizajeSifilisResult: number | null;
    toxoplasmaValidosResult: number | null;
    resultadoToxoplasmaResult: number | null;
    examenesHbCompletosResult: number | null;
    resultadoTamizajeHbResult: number | null;
    chagasResultadosValidosResult: number | null;
    resultadoChagasResult: number | null;
    ecografiasValidasResult: number | null;
    resultadoEcografiasResult: number | null;
    nutricionResult: number | null;
    resultadoNutricionResult: number | null;
    odontologiaResult: number | null;
    resultadoOdontologiaResult: number | null;
    ginecologiaResult: number | null;
    denominadorGinecologiaResult: number | null;
    porcentajeGinecologiaResult: number | null;
}

export interface InformeDatos {
    encabezado: {
      proceso: string;
      formato: string;
      entidad: string;
      vigencia: string;
      lugarFecha: string;
    };
    referencia: string;
    analisisResumido: string[];
    datosAExtraer: Array<{ label: string; valor: string }>;
    hallazgosCalidad: string[];
    recomendaciones: string[];
    observaciones: string[];
    inasistentes?: Array<{ [key: string]: string }>;
    kpisTFG?: {
      TFG_E1: number;
      TFG_E2: number;
      TFG_E3: number;
      TFG_E4: number;
      TFG_E5: number;
      TFG_TOTAL: number;
    };
    analisisAnual?: string;
  }
  