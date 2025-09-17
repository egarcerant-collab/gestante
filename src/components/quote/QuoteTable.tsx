
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

// Base64 encoded logo
const logoBase64 = "data:image/png;base64,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";


export function QuoteTable({ items }: QuoteTableProps) {
    const quoteRef = useRef<HTMLDivElement>(null);
    const [clientInfo, setClientInfo] = useState<ClientInfo>({
        name: "",
        nit: "",
        address: "",
        phone: "",
        email: "",
    });
    const [date, setDate] = useState<Date>(new Date());
    
  const handleDownloadPdf = async () => {
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

    (doc as any).autoTable({
        head: [['Descripción', 'Cantidad', 'Valor Unitario', 'Incluye IVA', 'Total']],
        body: tableData,
        startY: 70,
        didDrawPage: function (data: any) {
            // Header
            doc.addImage(logoBase64, 'PNG', data.settings.margin.left, 15, 20, 20);
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
