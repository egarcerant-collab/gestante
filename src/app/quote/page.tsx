import { Header } from "@/components/Header";
import { QuoteTable } from "@/components/quote/QuoteTable";

export default function QuotePage() {
  
  const sampleItems = [
    { "DESCRIPCION": "Cuaderno Doble Línea", "VALOR UNITARIO": 7000, hasIva: false, quantity: 5 },
    { "DESCRIPCION": "Caja de Lápices de Colores x12", "VALOR UNITARIO": 15000, hasIva: true, quantity: 2 },
    { "DESCRIPCION": "Resma de Papel Carta", "VALOR UNITARIO": 25000, hasIva: true, quantity: 10 },
    { "DESCRIPCION": "Agenda Ejecutiva 2024", "VALOR UNITARIO": 45000, hasIva: true, quantity: 1 },
    { "DESCRIPCION": "Juego Geométrico", "VALOR UNITARIO": 12000, hasIva: false, quantity: 3 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <QuoteTable items={sampleItems}/>
        </div>
      </main>
    </div>
  );
}
