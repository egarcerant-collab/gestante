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

// Datos de ejemplo
const sampleItems = [
  { description: "Producto A", quantity: 2, price: 25000, hasIva: true },
  { description: "Producto B", quantity: 1, price: 100000, hasIva: true },
  { description: "Producto C", quantity: 5, price: 10000, hasIva: false },
];

const IVA_RATE = 0.19; // 19% para Colombia

export function QuoteTable() {

  const calculateTotals = () => {
    let subtotal = 0;
    let ivaTotal = 0;

    sampleItems.forEach(item => {
        const itemTotal = item.quantity * item.price;
        subtotal += itemTotal;
        if (item.hasIva) {
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
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-center">Incluye IVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleItems.map((item, index) => {
                const total = item.quantity * item.price;
                return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
                  <TableCell className="text-center">{item.hasIva ? "Sí" : "No"}</TableCell>
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
