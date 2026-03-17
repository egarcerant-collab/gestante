/**
 * Calcula el NUMERADOR GINECOLOGÍA
 * @param rowsRaw  Filas devueltas por XLSX.utils.sheet_to_json
 * @returns número de gestantes en alto riesgo con fecha válida de 1ª consulta ginecología
 */
export function calcularNumeradorGinecologia(rowsRaw: Record<string, any>[]): number {
  if (!rowsRaw?.length) return 0;

  // --- helpers de normalización ---
  const clean = (s: any) => String(s ?? "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")  // sin tildes
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const pickKey = (obj: Record<string, any>, fragments: string[]) => {
    const keys = Object.keys(obj);
    const f = fragments.map(clean);
    return keys.find(k => f.every(seg => k.includes(seg))) || "";
  };

  const norm = (s: any) => clean(String(s ?? "").trim());
  const esSinDato = (s: any) => {
    const v = norm(s);
    return v === "" || v === "sin_dato" || v === "sin_datos" || v === "si_datos";
  };

  // Detectar columnas escaneando todas las filas (la primera puede tener celdas vacías)
  const allKeys = new Set<string>();
  for (const row of rowsRaw) { Object.keys(row).forEach(k => allKeys.add(clean(k))); }
  const firstClean: Record<string, true> = {};
  allKeys.forEach(k => { firstClean[k] = true; });

  const keyRiesgo = pickKey(firstClean, ["clasificacion", "riesgo"]);
  const keyGine1  = pickKey(firstClean, ["ginecolog", "primera"])
    || pickKey(firstClean, ["atencion", "especializada", "ginecolog"]);
  
  if (!keyRiesgo || !keyGine1) {
      console.error("Columnas clave no encontradas. Riesgo:", keyRiesgo, "Ginecología:", keyGine1);
      return 0;
  }


  // Convertir todas las filas a claves normalizadas
  const rows = rowsRaw.map(r => {
    const o: Record<string, any> = {};
    Object.keys(r).forEach(k => o[clean(k)] = r[k]);
    return o;
  });

  // ---- Cálculo principal (equivale a COUNTROWS filtrado en DAX) ----
  let numerador = 0;
  for (const row of rows) {
    const riesgoOK = norm(row[keyRiesgo]) === "alto_riesgo_obstetrico";
    const gineOK   = !esSinDato(row[keyGine1]);
    if (riesgoOK && gineOK) numerador++;
  }
  return numerador;
}

/**
 * Calcula el DENOMINADOR GINECOLOGÍA
 * @param rowsRaw Filas devueltas por XLSX.utils.sheet_to_json
 * @returns número de gestantes en alto riesgo
 */
export function calcularDenominadorGinecologia(rowsRaw: Record<string, any>[]): number {
  if (!rowsRaw?.length) return 0;

  // --- helpers de normalización ---
  const clean = (s: any) => String(s ?? "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const pickKey = (obj: Record<string, any>, fragments: string[]) => {
    const keys = Object.keys(obj);
    const f = fragments.map(clean);
    return keys.find(k => f.every(seg => k.includes(seg))) || "";
  };
  
  const norm = (s: any) => clean(String(s ?? "").trim());

  // Detectar columnas escaneando todas las filas
  const allKeys2 = new Set<string>();
  for (const row of rowsRaw) { Object.keys(row).forEach(k => allKeys2.add(clean(k))); }
  const firstClean: Record<string, true> = {};
  allKeys2.forEach(k => { firstClean[k] = true; });

  const keyRiesgo = pickKey(firstClean, ["clasificacion", "riesgo"]);

  if (!keyRiesgo) {
    console.error("Columna de riesgo no encontrada.");
    return 0;
  }

  // Convertir todas las filas a claves normalizadas
  const rows = rowsRaw.map(r => {
    const o: Record<string, any> = {};
    Object.keys(r).forEach(k => o[clean(k)] = r[k]);
    return o;
  });

  // ---- Cálculo principal ----
  let denominador = 0;
  for (const row of rows) {
    if (norm(row[keyRiesgo]) === "alto_riesgo_obstetrico") {
      denominador++;
    }
  }
  return denominador;
}