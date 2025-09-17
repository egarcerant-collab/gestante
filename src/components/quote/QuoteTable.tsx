
"use client";

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

const IVA_RATE = 0.19; // 19% para Colombia

interface QuoteTableProps {
    items: any[];
}

export function QuoteTable({ items = [] }: QuoteTableProps) {
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
    <Card>
      <CardHeader>
        <CardTitle>Detalles de la Cotización</CardTitle>
        <CardDescription>
          A continuación se presenta el desglose de los ítems, cantidades, precios e impuestos.
        </CardDescription>
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
