
"use client";

import { useRef, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { Download, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const IVA_RATE = 0.19; // 19% para Colombia

interface QuoteTableProps {
    items: any[];
}

interface ClientInfo {
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
}

export function QuoteTable({ items = [] }: QuoteTableProps) {
  const quoteRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: "RESGUARDO INDIGENA SOCORPA",
    nit: "824002172-7",
    address: "CR 7 4 A 45 BRR TRUJILLO, Becerril, Cesar, Colombia",
    phone: "3107455414",
    email: "cabildosokorpa@gmail.com",
  });

  const handleClientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({ ...prev, [name]: value }));
  };

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
            startY: 70,
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
                doc.text('Cotización', 150, 22);
                doc.setFontSize(10);
                doc.text(`Fecha: ${format(date, "PPP", { locale: es })}`, 150, 28);


                // Client Info
                doc.setFontSize(12);
                doc.text('Cliente:', data.settings.margin.left, 50);
                doc.setFontSize(10);
                doc.text(`${clientInfo.name} (NIT: ${clientInfo.nit})`, data.settings.margin.left + 20, 50);
                doc.text(`Dirección: ${clientInfo.address}`, data.settings.margin.left, 56);
                doc.text(`Teléfono: ${clientInfo.phone} | Email: ${clientInfo.email}`, data.settings.margin.left, 62);
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

        doc.output('dataurlnewwindow');
    };
    img.onerror = (e) => {
        console.error("Error loading image for PDF.", e);
        // Fallback if logo fails to load
        (doc as any).autoTable({
            head: [['Descripción', 'Cantidad', 'Valor Unitario', 'Incluye IVA', 'Total']],
            body: tableData,
             foot: [
                [{ content: 'Subtotal', colSpan: 4, styles: { halign: 'right' } }, { content: totals.subtotal, styles: { halign: 'right' } }],
                [{ content: 'IVA (19%)', colSpan: 4, styles: { halign: 'right' } }, { content: totals.ivaTotal, styles: { halign: 'right' } }],
                [{ content: 'Total a Pagar', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 12 } }, { content: totals.total, styles: { halign: 'right', fontStyle: 'bold', fontSize: 12 } }]
            ],
        });
        doc.output('dataurlnewwindow');
    }
};

  const calculateTotals = () => {
    let subtotal = 0;
    let ivaTotal = 0;

    items.forEach(item => {
        const valorUnitario = parseFloat(item['VALOR UNITARIO']) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const itemTotal = quantity * valorUnitario;
        
        const hasIvaString = String(item.hasIva).toLowerCase();
        if (hasIvaString === 'true' || hasIvaString === 'si') {
            subtotal += itemTotal / (1 + IVA_RATE);
            ivaTotal += (itemTotal / (1 + IVA_RATE)) * IVA_RATE;
        } else {
            subtotal += itemTotal;
        }
    });

    const total = subtotal + ivaTotal;

    return {
        subtotal: subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
        ivaTotal: ivaTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
        total: total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
    }
  }
  
  const calculateItemSubtotal = (item: any) => {
    const valorUnitario = parseFloat(item['VALOR UNITARIO']) || 0;
    const hasIvaString = String(item.hasIva).toLowerCase();
     if (hasIvaString === 'true' || hasIvaString === 'si') {
        return valorUnitario / (1 + IVA_RATE);
    }
    return valorUnitario;
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
                    Visualizar PDF
                </Button>
            </div>
        </div>
        <div className="mt-6 p-4 border rounded-lg bg-muted/20">
            <h3 className="font-semibold mb-4 text-lg">Información del Cliente y Fecha</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="client-name">Cliente</Label>
                    <Input id="client-name" name="name" value={clientInfo.name} onChange={handleClientInfoChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="client-nit">NIT/C.C.</Label>
                    <Input id="client-nit" name="nit" value={clientInfo.nit} onChange={handleClientInfoChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="client-address">Dirección</Label>
                    <Input id="client-address" name="address" value={clientInfo.address} onChange={handleClientInfoChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="client-phone">Teléfono</Label>
                    <Input id="client-phone" name="phone" value={clientInfo.phone} onChange={handleClientInfoChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input id="client-email" name="email" value={clientInfo.email} onChange={handleClientInfoChange} />
                </div>
                <div className="space-y-2">
                     <Label htmlFor="quote-date">Fecha de Cotización</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => setDate(d || new Date())}
                            initialFocus
                            locale={es}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
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
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const valorUnitario = parseFloat(item['VALOR UNITARIO']) || 0;
                const quantity = parseInt(item.quantity) || 1;
                const itemSubtotal = calculateItemSubtotal(item);
                const total = quantity * valorUnitario;
                
                return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item['DESCRIPCION']}</TableCell>
                  <TableCell className="text-center">{quantity}</TableCell>
                  <TableCell className="text-right">{valorUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                  <TableCell className="text-right">{itemSubtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
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

    