import { Header } from "@/components/Header";
import { QuoteTable } from "@/components/quote/QuoteTable";

export default function QuotePage() {
  
  const sampleItems = [
    { "DESCRIPCION": "Servicio de Consultoría", "VALOR UNITARIO": 150000, hasIva: true, quantity: 1 },
    { "DESCRIPCION": "Licencia de Software (Anual)", "VALOR UNITARIO": 300000, hasIva: true, quantity: 2 },
    { "DESCRIPCION": "Soporte Técnico (mensual)", "VALOR UNITARIO": 50000, hasIva: false, quantity: 12 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Cotización</h2>
          <QuoteTable items={sampleItems}/>
        </div>
      </main>
    </div>
  );
}
