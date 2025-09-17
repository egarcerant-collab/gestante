
'use client';

export async function urlToPngDataURL(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo obtener la imagen: ${res.status}`);
  const blob = await res.blob();

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = URL.createObjectURL(blob);
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no soportado");

  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/png"); 
  URL.revokeObjectURL(img.src);
  return dataUrl;
}
