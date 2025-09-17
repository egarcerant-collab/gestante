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

interface QuoteInfo {
    id: string;
    validUntil: Date;
}

const logoBase64 = "data:image/png;base64,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";


export function QuoteTable({ items }: QuoteTableProps) {
    const quoteRef = useRef<HTMLDivElement>(null);
    const [clientInfo, setClientInfo] = useState<ClientInfo>({
        name: "RESGUARDO INDIGENA SOCORPA",
        nit: "824002172-7",
        address: "CR 7 4 A 45 BRR TRUJILLO, Becerril, Cesar, Colombia",
        phone: "3107455414",
        email: "cabildosokorpa@gmail.com",
    });
    const [date, setDate] = useState<Date>(new Date());
    const [quoteInfo, setQuoteInfo] = useState<QuoteInfo>({
        id: 'COTZ-4',
        validUntil: new Date(new Date().setDate(new Date().getDate() + 15)),
    });
    
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const tableData = items.map(item => {
        const valorUnitario = parseFloat(item['valor']) || 0;
        const quantity = parseInt(item.CANTIDAD) || 1;
        const iva = (parseFloat(item.IVA) || 0) / 100;
        const dcto = parseFloat(item.DCTO) || 0;
        const total = (quantity * valorUnitario) * (1 - dcto);
        
        return [
            item['CÓDIGO'],
            item['DESCRIPCION'],
            item['U. MEDIDA'],
            quantity,
            valorUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
            `${item.IVA || 0}%`,
            `${(dcto * 100).toFixed(2)}%`,
            total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
        ];
    });

    const totals = calculateTotals();

    (doc as any).autoTable({
        head: [['Código', 'Descripción', 'U. Medida', 'Cantidad', 'Precio U.', 'IVA', 'DCTO', 'Total']],
        body: tableData,
        startY: 95,
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
            
            // Client Info Box
            doc.rect(data.settings.margin.left, 45, 95, 38);
            doc.setFontSize(10);
            doc.text('Cliente:', data.settings.margin.left + 2, 50);
            doc.text(clientInfo.name, data.settings.margin.left + 22, 50);
            doc.text('NIT:', data.settings.margin.left + 2, 56);
            doc.text(clientInfo.nit, data.settings.margin.left + 22, 56);
            doc.text('Dirección:', data.settings.margin.left + 2, 62);
            doc.text(clientInfo.address, data.settings.margin.left + 22, 62, { maxWidth: 70 });
            doc.text('Teléfono:', data.settings.margin.left + 2, 74);
            doc.text(clientInfo.phone, data.settings.margin.left + 22, 74);
            doc.text('Email:', data.settings.margin.left + 2, 80);
            doc.text(clientInfo.email, data.settings.margin.left + 22, 80);
            
            // Quote Info Box
            const quoteBoxX = data.settings.margin.left + 100;
            doc.rect(quoteBoxX, 45, 85, 38);
            doc.text('COTIZACIÓN:', quoteBoxX + 2, 50);
            doc.text(quoteInfo.id, quoteBoxX + 35, 50);
            doc.text('MONEDA:', quoteBoxX + 2, 56);
            doc.text('COP Colombia, Pesos', quoteBoxX + 35, 56);
            
            doc.text('FECHA DE EMISIÓN', quoteBoxX + 5, 65);
            doc.text(format(date, "dd / MM / yyyy"), quoteBoxX + 5, 72);

            doc.text('VÁLIDO HASTA', quoteBoxX + 50, 65);
            doc.text(format(quoteInfo.validUntil, "dd / MM / yyyy"), quoteBoxX + 50, 72);
        },
        foot: [
            [{ content: 'Subtotal', colSpan: 7, styles: { halign: 'right' } }, { content: totals.subtotal, styles: { halign: 'right' } }],
            [{ content: `IVA (${(IVA_RATE * 100)}%)`, colSpan: 7, styles: { halign: 'right' } }, { content: totals.ivaTotal, styles: { halign: 'right' } }],
            [{ content: 'Total a Pagar', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold', fontSize: 12 } }, { content: totals.total, styles: { halign: 'right', fontStyle: 'bold', fontSize: 12 } }]
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
            fontSize: 8,
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 15, halign: 'center' },
            6: { cellWidth: 15, halign: 'center' },
            7: { cellWidth: 25, halign: 'right' }
        }
    });

    doc.output('dataurlnewwindow');
};

  const handleClientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleQuoteInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const {name, value} = e.target;
      setQuoteInfo(prev => ({...prev, [name]: value}));
  }

  if (!items || items.length === 0) {
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
        const valorUnitario = parseFloat(item['valor']) || 0;
        const quantity = parseInt(item.CANTIDAD) || 1;
        const ivaRate = (parseFloat(item.IVA) || 0) / 100;
        const dctoRate = parseFloat(item.DCTO) || 0;
        
        const itemTotalAfterDcto = (quantity * valorUnitario) * (1 - dctoRate);
        const itemSubtotal = itemTotalAfterDcto / (1 + ivaRate);
        const itemIva = itemSubtotal * ivaRate;

        subtotal += itemSubtotal;
        ivaTotal += itemIva;
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
                        <img src={logoBase64} alt="Logo" className="w-12 h-12 rounded-full"/>
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
        <div className="mt-6 p-4 border rounded-lg bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="font-semibold mb-4 text-lg">Información del Cliente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="client-name">Cliente</Label>
                        <Input id="client-name" name="name" value={clientInfo.name} onChange={handleClientInfoChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="client-nit">NIT/C.C.</Label>
                        <Input id="client-nit" name="nit" value={clientInfo.nit} onChange={handleClientInfoChange} />
                    </div>
                     <div className="space-y-2 sm:col-span-2">
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
                </div>
            </div>
            <div>
                <h3 className="font-semibold mb-4 text-lg">Información de la Cotización</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="quote-id">No. Cotización</Label>
                        <Input id="quote-id" name="id" value={quoteInfo.id} onChange={handleQuoteInfoChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="quote-date">Fecha de Emisión</Label>
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
                    <div className="space-y-2">
                        <Label htmlFor="quote-valid-until">Válido Hasta</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !quoteInfo.validUntil && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {quoteInfo.validUntil ? format(quoteInfo.validUntil, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={quoteInfo.validUntil}
                                onSelect={(d) => setQuoteInfo(prev => ({...prev, validUntil: d || new Date()}))}
                                initialFocus
                                locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label>Moneda</Label>
                        <Input value="COP Colombia, Pesos" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Total de Líneas</Label>
                        <Input value={items.length} disabled />
                    </div>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">U. Medida</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Precio U.</TableHead>
                <TableHead className="text-center">IVA</TableHead>
                <TableHead className="text-center">DCTO.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const valorUnitario = parseFloat(item['valor']) || 0;
                const quantity = parseInt(item.CANTIDAD) || 1;
                const dcto = parseFloat(item.DCTO) || 0;
                const total = (quantity * valorUnitario) * (1-dcto);
                
                return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{item['CÓDIGO']}</TableCell>
                  <TableCell>{item['DESCRIPCION']}</TableCell>
                  <TableCell className="text-center">{item['U. MEDIDA']}</TableCell>
                  <TableCell className="text-center">{quantity}</TableCell>
                  <TableCell className="text-right">{valorUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                  <TableCell className="text-center">{`${item.IVA || 0}%`}</TableCell>
                  <TableCell className="text-center">{`${(dcto * 100).toFixed(2)}%`}</TableCell>
                  <TableCell className="text-right">{total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                </TableRow>
              )})}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={8} className="text-right font-bold">Subtotal</TableCell>
                    <TableCell className="text-right font-bold">{totals.subtotal}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={8} className="text-right font-bold">IVA ({ (IVA_RATE * 100)}%)</TableCell>
                    <TableCell className="text-right font-bold">{totals.ivaTotal}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={8} className="text-right font-bold text-lg">Total a Pagar</TableCell>
                    <TableCell className="text-right font-bold text-lg">{totals.total}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
