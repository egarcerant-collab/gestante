
"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const IVA_RATE = 0.19; // 19% para Colombia

interface QuoteTableProps {
    items: any[];
}

export function QuoteTable({ items = [] }: QuoteTableProps) {
  const quoteRef = useRef<HTMLDivElement>(null);
  
  if (items.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Detalles de la Cotización</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No hay ítems para mostrar.</p>
            </CardContent>
        </Card>
    )
  }

  const handleDownloadPdf = () => {
    const input = quoteRef.current;
    if (!input) return;

    // Hide the download button before taking the screenshot
    const downloadButton = input.querySelector('#download-pdf-btn') as HTMLElement;
    if(downloadButton) downloadButton.style.display = 'none';

    html2canvas(input, { scale: 2 }).then((canvas) => {
        // Show the button again after screenshot
        if(downloadButton) downloadButton.style.display = 'flex';
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth - 20; // with margin
        const height = width / ratio;
        
        let position = 10;
        
        pdf.addImage(imgData, 'PNG', 10, position, width, height);

        const date = new Date().toLocaleDateString('es-CO');
        pdf.save(`cotizacion-${date}.pdf`);
    });
};

  const calculateTotals = () => {
    let subtotal = 0;
    let ivaTotal = 0;

    items.forEach(item => {
        const valorUnitario = parseFloat(item['VALOR UNITARIO']) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const itemTotal = quantity * valorUnitario;
        subtotal += itemTotal;
        
        // Check for a boolean-like value for IVA. Handles strings "true", "si" and booleans.
        const hasIvaString = String(item.hasIva).toLowerCase();
        if (hasIvaString === 'true' || hasIvaString === 'si') {
            ivaTotal += itemTotal * IVA_RATE;
        }
    });

    const total = subtotal + ivaTotal;

    return {
        subtotal: subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
        ivaTotal: ivaTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
        total: total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
    }
  }

  const totals = calculateTotals();

  const getDisplayValue = (item: any, key: string) => {
    const value = item[key];
    if (key === 'VALOR UNITARIO') {
        return (parseFloat(value) || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    }
    if (key.toLowerCase().includes('iva')) {
         const hasIvaString = String(value).toLowerCase();
        return (hasIvaString === 'true' || hasIvaString === 'si') ? "Sí" : "No";
    }
    return value;
  }

  return (
    <Card ref={quoteRef}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Detalles de la Cotización</CardTitle>
                <CardDescription>
                A continuación se presenta el desglose de los ítems, cantidades, precios e impuestos.
                </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-4">
                 <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center justify-end gap-3 mb-2">
                        <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-full" />
                        <p className="font-bold text-lg text-foreground">DISTRIBUIDORA MILADYS SOLANO</p>
                    </div>
                    <p>NIT: 1122813197-5</p>
                    <p>CR 24 CL 13 145, Becerril, Cesar</p>
                    <p>Celular: 3167533999</p>
                </div>
                <Button id="download-pdf-btn" onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Valor Unitario</TableHead>
                <TableHead className="text-center">Incluye IVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const valorUnitario = parseFloat(item['VALOR UNITARIO']) || 0;
                const quantity = parseInt(item.quantity) || 1;
                const total = quantity * valorUnitario;
                const hasIvaString = String(item.hasIva).toLowerCase();
                const ivaDisplay = (hasIvaString === 'true' || hasIvaString === 'si') ? "Sí" : "No";
                
                return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item['DESCRIPCION']}</TableCell>
                  <TableCell className="text-center">{quantity}</TableCell>
                  <TableCell className="text-right">{valorUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                  <TableCell className="text-center">{ivaDisplay}</TableCell>
                  <TableCell className="text-right">{total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                </TableRow>
              )})}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">Subtotal</TableCell>
                    <TableCell className="text-right font-bold">{totals.subtotal}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">IVA (19%)</TableCell>
                    <TableCell className="text-right font-bold">{totals.ivaTotal}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold text-lg">Total a Pagar</TableCell>
                    <TableCell className="text-right font-bold text-lg">{totals.total}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
