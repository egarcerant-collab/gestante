
"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
    const doc = new jsPDF();
    const tableData = items.map(item => {
        const valorUnitario = parseFloat(item['VALOR UNITARIO']) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const total = quantity * valorUnitario;
        const hasIvaString = String(item.hasIva).toLowerCase();
        const ivaDisplay = (hasIvaString === 'true' || hasIvaString === 'si') ? "Sí" : "No";

        return [
            item['DESCRIPCION'],
            quantity,
            valorUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
            ivaDisplay,
            total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
        ];
    });

    const totals = calculateTotals();
    
    // Convert logo to base64
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');

        (doc as any).autoTable({
            head: [['Descripción', 'Cantidad', 'Valor Unitario', 'Incluye IVA', 'Total']],
            body: tableData,
            startY: 40,
            didDrawPage: function (data: any) {
                // Header
                doc.addImage(dataURL, 'PNG', data.settings.margin.left, 15, 20, 20);
                doc.setFontSize(16);
                doc.setTextColor(40);
                doc.text('DISTRIBUIDORA MILADYS SOLANO', data.settings.margin.left + 25, 22);
                doc.setFontSize(10);
                doc.text('NIT: 1122813197-5', data.settings.margin.left + 25, 28);
                doc.text('CR 24 CL 13 145, Becerril, Cesar', data.settings.margin.left + 25, 32);
                doc.text('Celular: 3167533999', data.settings.margin.left + 25, 36);
                
                doc.setFontSize(18);
                doc.text('Cotización', data.settings.margin.left + 150, 22);

            },
            foot: [
                [{ content: 'Subtotal', colSpan: 4, styles: { halign: 'right' } }, { content: totals.subtotal, styles: { halign: 'right' } }],
                [{ content: 'IVA (19%)', colSpan: 4, styles: { halign: 'right' } }, { content: totals.ivaTotal, styles: { halign: 'right' } }],
                [{ content: 'Total a Pagar', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 12 } }, { content: totals.total, styles: { halign: 'right', fontStyle: 'bold', fontSize: 12 } }]
            ],
            footStyles: {
                fillColor: [239, 239, 239]
            },
            headStyles: {
                fillColor: [37, 52, 79],
                textColor: [255, 255, 255]
            },
            styles: {
                cellPadding: 2,
                fontSize: 10,
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 30, halign: 'right' }
            }
        });

        const date = new Date().toLocaleDateString('es-CO');
        doc.save(`cotizacion-${date}.pdf`);
    };
    img.onerror = () => {
        console.error("Error loading logo for PDF.");
        // Fallback if logo fails to load
        (doc as any).autoTable({
            head: [['Descripción', 'Cantidad', 'Valor Unitario', 'Incluye IVA', 'Total']],
            body: tableData,
        });
        const date = new Date().toLocaleDateString('es-CO');
        doc.save(`cotizacion-${date}.pdf`);
    }
};

  const calculateTotals = () => {
    let subtotal = 0;
    let ivaTotal = 0;

    items.forEach(item => {
        const valorUnitario = parseFloat(item['VALOR UNITARIO']) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const itemTotal = quantity * valorUnitario;
        subtotal += itemTotal;
        
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
                        <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-full"/>
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

    