"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { calcularNumeradorGinecologia, calcularDenominadorGinecologia } from "@/lib/kpi-helpers";
import type { KpiResults, InformeDatos } from "@/lib/types";
import { generarInformePDF, type PdfImages } from "@/lib/informe-riesgo-pdf";
import JSZip from "jszip";

const availableFiles: Record<string, { name: string; path: string }[]> = {
  "2026": [
    { name: "Enero", path: "/BASES/2026/ENERO/enero.xlsx" },
    { name: "Febrero", path: "/BASES/2026/FEBRERO/febrero.xlsx" },
  ],
};

const monthOrder = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];

const cleanHeader = (h: string) =>
  String(h || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

const pickHeaderSafe = (rowObj: Record<string, any>, includes: string[]): string => {
  const keys = Object.keys(rowObj);
  const cleanedIncludes = includes.map((f) => cleanHeader(f));
  for (const k of keys) {
    const ck = cleanHeader(k);
    if (cleanedIncludes.every((frag) => ck.includes(frag))) return ck;
  }
  return "";
};

const sd = (v: string) => v.trim() === "" || v.includes("sin datos") || v.includes("sin dato");

const calculateKpisForGroup = (groupRows: any[]) => {
  if (!groupRows || groupRows.length === 0) return {};
  const firstRowCleaned: any = {};
  for (const k in groupRows[0]) firstRowCleaned[cleanHeader(k)] = groupRows[0][k];

  const cleanedData = groupRows.map((row: any) => {
    const o: Record<string, any> = {};
    for (const k in row) o[cleanHeader(k)] = row[k];
    return o;
  });

  const controlIdKey  = pickHeaderSafe(firstRowCleaned, ["identificacion"]);
  const captacionKey  = pickHeaderSafe(firstRowCleaned, ["edad", "gest", "inicio", "control"]);
  const vih1Key       = pickHeaderSafe(firstRowCleaned, ["vih", "primer", "tamiz"]);
  const vih2Key       = pickHeaderSafe(firstRowCleaned, ["vih", "segundo", "tamiz"]);
  const vih3Key       = pickHeaderSafe(firstRowCleaned, ["vih", "tercer", "tamiz"]);
  const sif1Key       = pickHeaderSafe(firstRowCleaned, ["sifilis", "primera"]);
  const sif2Key       = pickHeaderSafe(firstRowCleaned, ["sifilis", "segunda"]);
  const sif3Key       = pickHeaderSafe(firstRowCleaned, ["sifilis", "tercera"]);
  const toxoKey       = pickHeaderSafe(firstRowCleaned, ["toxoplasma", "resultado"]);
  const hbResKey      = pickHeaderSafe(firstRowCleaned, ["hepatitis", "b", "resultado"]);
  const hbFechaKey    = pickHeaderSafe(firstRowCleaned, ["hepatitis", "b", "fecha"]);
  const chagasKey     = pickHeaderSafe(firstRowCleaned, ["chagas", "resultado"]);
  const eco1Key       = pickHeaderSafe(firstRowCleaned, ["ecografia", "translucencia"]);
  const eco2Key       = pickHeaderSafe(firstRowCleaned, ["ecografia", "anomalias"]);
  const eco3Key       = pickHeaderSafe(firstRowCleaned, ["ecografia", "otras"]);
  const nutriKey      = pickHeaderSafe(firstRowCleaned, ["nutricion"]);
  const odontoKey     = pickHeaderSafe(firstRowCleaned, ["odontolog", "fecha"]) || pickHeaderSafe(firstRowCleaned, ["odontolog"]);

  let controlCount = 0, captacionCount = 0;
  let sinVih = 0, sinSif = 0, sinToxo = 0, sinHb = 0, sinChagas = 0, sinEco = 0, sinNutri = 0, sinOdonto = 0;
  const total = cleanedData.length;

  cleanedData.forEach((row: any) => {
    if (row[controlIdKey] !== undefined && row[controlIdKey] !== "") controlCount++;
    const capNum = parseFloat(String(row[captacionKey] || "").replace(",", "."));
    if (!isNaN(capNum) && capNum < 10) captacionCount++;

    if (sd(String(row[vih1Key]||"").toLowerCase()) && sd(String(row[vih2Key]||"").toLowerCase()) && sd(String(row[vih3Key]||"").toLowerCase())) sinVih++;
    if (sd(String(row[sif1Key]||"").toLowerCase()) && sd(String(row[sif2Key]||"").toLowerCase()) && sd(String(row[sif3Key]||"").toLowerCase())) sinSif++;
    if (sd(String(row[toxoKey]||"").toLowerCase())) sinToxo++;
    if (sd(String(row[hbResKey]||"").toLowerCase()) && !(row[hbFechaKey] === undefined || row[hbFechaKey] === "")) sinHb++;
    if (sd(String(row[chagasKey]||"").toLowerCase())) sinChagas++;
    if (sd(String(row[eco1Key]||"").toLowerCase()) && sd(String(row[eco2Key]||"").toLowerCase()) && sd(String(row[eco3Key]||"").toLowerCase())) sinEco++;
    if (sd(String(row[nutriKey]||"").toLowerCase())) sinNutri++;
    if (sd(String(row[odontoKey]||"").toLowerCase())) sinOdonto++;
  });

  const ginNum  = calcularNumeradorGinecologia(groupRows);
  const ginDen  = calcularDenominadorGinecologia(groupRows);
  const examVih = total - sinVih;
  const examSif = total - sinSif;
  const toxoVal = total - sinToxo;
  const hbComp  = total - sinHb;
  const chVal   = total - sinChagas;
  const ecoVal  = total - sinEco;
  const nutVal  = total - sinNutri;
  const odoVal  = total - sinOdonto;
  const pct = (n: number, d: number) => d > 0 ? (n / d) * 100 : 0;

  return {
    "Gestantes en Control": controlCount,
    "Captación Oportuna (< 10 sem)": captacionCount,
    "% Captación Oportuna": pct(captacionCount, controlCount),
    "Exámenes VIH Completos": examVih,
    "% Tamizaje VIH": pct(examVih, controlCount),
    "Exámenes Sífilis Completos": examSif,
    "% Tamizaje Sífilis": pct(examSif, controlCount),
    "Toxoplasma Válidos": toxoVal,
    "% Tamizaje Toxoplasma": pct(toxoVal, controlCount),
    "Exámenes Hepatitis B Completos": hbComp,
    "% Tamizaje Hepatitis B": pct(hbComp, controlCount),
    "Chagas Válidos": chVal,
    "% Tamizaje Chagas": pct(chVal, controlCount),
    "Ecografías Válidas": ecoVal,
    "% Ecografías": pct(ecoVal, controlCount),
    "Consultas Nutrición": nutVal,
    "% Nutrición": pct(nutVal, controlCount),
    "Consultas Odontología": odoVal,
    "% Odontología": pct(odoVal, controlCount),
    "Gestantes Alto Riesgo con Ginecología": ginNum,
    "Total Gestantes Alto Riesgo": ginDen,
    "% Cobertura Ginecología (Alto Riesgo)": pct(ginNum, ginDen),
  };
};

const indicatorHeaders = [
  "DEPARTAMENTO","MUNICIPIO","IPS",
  "Gestantes en Control","Captación Oportuna (< 10 sem)","% Captación Oportuna",
  "Exámenes VIH Completos","% Tamizaje VIH",
  "Exámenes Sífilis Completos","% Tamizaje Sífilis",
  "Toxoplasma Válidos","% Tamizaje Toxoplasma",
  "Exámenes Hepatitis B Completos","% Tamizaje Hepatitis B",
  "Chagas Válidos","% Tamizaje Chagas",
  "Ecografías Válidas","% Ecografías",
  "Consultas Nutrición","% Nutrición",
  "Consultas Odontología","% Odontología",
  "Gestantes Alto Riesgo con Ginecología","Total Gestantes Alto Riesgo","% Cobertura Ginecología (Alto Riesgo)",
];

export default function ConsolidadoAnualPage() {
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [consolidatedIndicators, setConsolidatedIndicators] = useState<any[]>([]);
  const [consolidatedBaseData, setConsolidatedBaseData] = useState<any[]>([]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setError(null);
    setSuccessMessage(null);
    setConsolidatedIndicators([]);
    setConsolidatedBaseData([]);
  };

  const handleGenerateConsolidated = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setConsolidatedIndicators([]);
    setConsolidatedBaseData([]);

    const filesForYear = availableFiles[selectedYear];
    if (!filesForYear || filesForYear.length === 0) {
      setError(`No hay archivos disponibles para el año ${selectedYear}.`);
      setIsLoading(false);
      return;
    }

    try {
      const allRows: any[] = [];
      for (const fileInfo of filesForYear) {
        try {
          const response = await fetch(fileInfo.path);
          if (!response.ok) { console.warn(`No se pudo cargar ${fileInfo.name}. Saltando...`); continue; }
          const buf = await response.arrayBuffer();
          const workbook = XLSX.read(buf, { type: "array", cellDates: true, raw: true });
          const ws = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
          if (jsonData.length > 0) allRows.push(...jsonData.map(r => ({ ...r, MES: fileInfo.name.toUpperCase() })));
        } catch (e) { console.warn(`Error procesando ${fileInfo.path}`, e); }
      }

      if (allRows.length === 0) {
        setError("No se encontraron datos en los archivos del año seleccionado.");
        setIsLoading(false);
        return;
      }

      // Encontrar clave de identificación
      let idKeyOrig = "";
      const firstSample: any = {};
      for (const k in allRows[0]) firstSample[cleanHeader(k)] = allRows[0][k];
      const idCleanKey = pickHeaderSafe(firstSample, ["identificacion"]) || pickHeaderSafe(firstSample, ["no", "documento"]);
      const origHeaders: Record<string,string> = {};
      for (const k in allRows[0]) origHeaders[cleanHeader(k)] = k;
      idKeyOrig = origHeaders[idCleanKey] || "";

      if (!idKeyOrig) {
        setError("No se pudo encontrar columna de identificación para deduplicar.");
        setIsLoading(false);
        return;
      }

      // Deduplicar: conservar registro del mes más reciente por afiliado
      const latestRecords: Record<string, any> = {};
      for (const row of allRows) {
        const docId = String(row[idKeyOrig] || "").trim();
        if (docId.length <= 1) continue;
        const existing = latestRecords[docId];
        if (!existing || monthOrder.indexOf(row.MES) > monthOrder.indexOf(existing.MES)) {
          latestRecords[docId] = row;
        }
      }

      const finalData = Object.values(latestRecords);
      setConsolidatedBaseData(finalData);
      setSuccessMessage(`Procesados ${allRows.length} registros → ${finalData.length} registros únicos (último mes por afiliado).`);

      // Calcular indicadores agrupados por DEPTO / MUNICIPIO / IPS
      if (finalData.length > 0) {
        const sample = finalData[0] || {};
        const origH: Record<string,string> = {};
        for (const k in sample) origH[cleanHeader(k)] = k;

        const deptKey = origH[pickHeaderSafe(sample, ["departamento","residencia"]) || pickHeaderSafe(sample, ["departamento"])];
        const muniKey = origH[pickHeaderSafe(sample, ["municipio","residencia"]) || pickHeaderSafe(sample, ["municipio"])];
        const ipsKey  = origH[pickHeaderSafe(sample, ["ips","primaria"]) || pickHeaderSafe(sample, ["nombre","ips"])];

        const normalize = (s: string) =>
          s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/\s+/g," ").trim();

        const groupedData: Record<string, any[]> = {};
        for (const row of finalData) {
          const d = normalize(String(row[deptKey]||""));
          const m = normalize(String(row[muniKey]||""));
          const i = normalize(String(row[ipsKey]||""));
          if (!d || !m || !i) continue;
          const key = `${d}|${m}|${i}`;
          if (!groupedData[key]) groupedData[key] = [];
          groupedData[key].push(row);
        }

        const indicators = Object.entries(groupedData).map(([key, rows]) => {
          const [DEPARTAMENTO, MUNICIPIO, IPS] = key.split("|");
          return { DEPARTAMENTO, MUNICIPIO, IPS, ...calculateKpisForGroup(rows) };
        });

        setConsolidatedIndicators(indicators);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Error al generar el consolidado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBaseXls = () => {
    if (!consolidatedBaseData.length) return;
    const ws = XLSX.utils.json_to_sheet(consolidatedBaseData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Consolidado ${selectedYear}`);
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Consolidado_Anual_${selectedYear}.xlsx`);
  };

  const handleDownloadIndicatorsXls = () => {
    if (!consolidatedIndicators.length) return;
    const ws = XLSX.utils.json_to_sheet(consolidatedIndicators, { header: indicatorHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Indicadores ${selectedYear}`);
    // Formato porcentaje
    for (let i = 2; i <= consolidatedIndicators.length + 1; i++) {
      indicatorHeaders.forEach((h, ci) => {
        if (h.startsWith("%")) {
          const col = XLSX.utils.encode_col(ci);
          const cell = ws[`${col}${i}`];
          if (cell && typeof cell.v === "number") { cell.z = "0.00%"; cell.v = cell.v / 100; }
        }
      });
    }
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Indicadores_${selectedYear}.xlsx`);
  };

  const handleGeneratePdfs = async () => {
    if (!consolidatedIndicators.length) { setError("Primero genera el consolidado."); return; }
    setIsLoading(true);
    setError(null);
    const zip = new JSZip();
    try {
      // Cargar imagen de fondo como base64
      let bgDataUrl: string | undefined;
      try {
        const resp = await fetch("/imagenes/IMAGENEN UNIFICADA.jpg");
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          bgDataUrl = `data:image/jpeg;base64,${b64}`;
        }
      } catch { /* sin imagen */ }

      const images: PdfImages = bgDataUrl ? { background: bgDataUrl } : {};

      for (const ind of consolidatedIndicators) {
        const datos: InformeDatos = {
          encabezado: {
            proceso: "Seguimiento a la Gestión del Riesgo en Salud",
            formato: "Informe de Evaluación de Indicadores",
            entidad: `${ind.IPS} (${ind.MUNICIPIO})`,
            vigencia: `Consolidado ${selectedYear}`,
            lugarFecha: `VALLEDUPAR, ${new Date().toLocaleDateString("es-CO")}`,
          },
          referencia: `Análisis de indicadores consolidados para la vigencia ${selectedYear}.`,
          analisisResumido: [
            `Total gestantes en control: ${ind["Gestantes en Control"] ?? "N/A"}`,
            `Captación oportuna: ${ind["Captación Oportuna (< 10 sem)"] ?? "N/A"} (${ind["% Captación Oportuna"]?.toFixed(2) ?? "N/A"}%)`,
          ],
          datosAExtraer: indicatorHeaders
            .filter(h => !["DEPARTAMENTO","MUNICIPIO","IPS"].includes(h))
            .map(h => ({
              label: h,
              valor: typeof ind[h] === "number"
                ? h.startsWith("%") ? `${ind[h].toFixed(2)}%` : String(ind[h])
                : String(ind[h] ?? "N/A"),
            })),
          hallazgosCalidad: [
            "Asegurar la orden y realización oportuna de ecografías según edad gestacional.",
            "Normalizar el registro de pruebas serológicas (VIH, Sífilis, Hepatitis B, Toxoplasma, Chagas).",
            "Promover y documentar la realización de citología cervicouterina.",
            "Registrar oportunamente la aplicación de vacunas (Tdap, Influenza).",
            "Garantizar y registrar la entrega de suplementos (ácido fólico, hierro, calcio).",
            "Actualizar los desenlaces obstétricos sistemáticamente.",
            "Fortalecer la captación temprana antes de semana 10.",
          ],
          recomendaciones: [
            "Diseñar y aplicar procesos de evaluación de calidad de la atención.",
            "Implementar acciones de mejora para la demanda inducida institucional.",
            "Implementar tamización con pruebas rápidas treponémicas en puntos sin laboratorio.",
            "Garantizar atención especializada por ginecología para gestantes de alto riesgo (Res. 3280/2018).",
          ],
          observaciones: [
            "Se solicitan historias clínicas de gestantes que no cumplen criterios de calidad.",
            "Aplicar correctivos necesarios para el mejoramiento continuo.",
          ],
        };
        const blob = await generarInformePDF(datos, images, "", true);
        if (blob) {
          const filename = `Informe_${ind.MUNICIPIO.replace(/\s+/g,"_")}_${ind.IPS.replace(/\s+/g,"_")}.pdf`;
          zip.file(filename, blob);
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Informes_Consolidado_${selectedYear}.zip`);
    } catch (e: any) {
      console.error(e);
      setError("Error al generar los PDFs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(135deg, #0f172a 0%, #0c1a2e 40%, #0f2027 70%, #0f172a 100%)" }}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="text-white border-white/20 bg-white/5 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Consolidado Anual por IPS</h1>
            <p className="text-white/50 text-sm">Indicadores agrupados · Dusakawi EPSI</p>
          </div>
        </div>

        {/* Selector */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-white/70">Vigencia</Label>
              <Select onValueChange={handleYearChange} value={selectedYear}>
                <SelectTrigger className="h-11 rounded-xl border-white/15 text-white" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }} className="text-white">
                  {Object.keys(availableFiles).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateConsolidated} disabled={isLoading}
              className="h-11 rounded-xl font-semibold md:col-span-2"
              style={{ background: "linear-gradient(135deg, #14b8a6, #3b82f6)" }}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</> : "▶ Generar Consolidado"}
            </Button>
          </div>

          {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {successMessage && (
            <Alert className="border-emerald-500/30 bg-emerald-500/10">
              <AlertTitle className="text-emerald-400">✓ Proceso Completado</AlertTitle>
              <AlertDescription className="text-emerald-300">{successMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Tabla de indicadores */}
        {consolidatedIndicators.length > 0 && (
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-white font-bold text-lg">Indicadores por IPS · {selectedYear}</h2>
                <p className="text-white/50 text-sm">{consolidatedIndicators.length} IPS con datos</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleDownloadBaseXls} disabled={isLoading} size="sm"
                  className="rounded-xl text-white border-white/15" variant="outline" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Download className="mr-2 h-4 w-4" />Base (XLSX)
                </Button>
                <Button onClick={handleDownloadIndicatorsXls} disabled={isLoading} size="sm"
                  className="rounded-xl text-white border-white/15" variant="outline" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Download className="mr-2 h-4 w-4" />Indicadores (XLSX)
                </Button>
                <Button onClick={handleGeneratePdfs} disabled={isLoading} size="sm"
                  className="rounded-xl font-semibold" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Informes PDF (ZIP)
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[500px] w-full rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <Table>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#0f172a" }}>
                  <TableRow style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    {indicatorHeaders.map(h => (
                      <TableHead key={h} className="text-white/60 text-xs whitespace-nowrap px-3 py-2">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidatedIndicators.map((data, i) => (
                    <TableRow key={i} style={{ borderColor: "rgba(255,255,255,0.05)" }}
                      className="hover:bg-white/5 transition-colors">
                      {indicatorHeaders.map(h => (
                        <TableCell key={h} className="text-white/80 text-xs whitespace-nowrap px-3 py-2">
                          {typeof data[h] === "number"
                            ? h.startsWith("%") ? `${data[h].toFixed(1)}%` : data[h]
                            : data[h]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        <footer className="text-center pb-4">
          <p className="text-white/15 text-xs">Sistema de Indicadores Materno-Perinatales · Dusakawi EPSI · {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
