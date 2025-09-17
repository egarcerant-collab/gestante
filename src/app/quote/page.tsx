import { Header } from "@/components/Header";
import { QuoteTable } from "@/components/quote/QuoteTable";

export default function QuotePage() {
  
  const sampleItems = [
    { "#": 1, "CÓDIGO": "MRCDR", "DESCRIPCION": "MARCADOR BORRABLE PUNTA CUADRADA AZUL RECARGABLE", "U. MEDIDA": 94, "CANTIDAD": 1, "PRECIO U.": 3535, "IVA": 19, "DCTO.": 0, "TOTAL": 3535},
    { "#": 2, "CÓDIGO": "LAPCOL", "DESCRIPCION": "Caja de Lápices de Colores x12", "U. MEDIDA": 1, "CANTIDAD": 2, "PRECIO U.": 15000, "IVA": 19, "DCTO.": 0.05, "TOTAL": 28500 },
    { "#": 3, "CÓDIGO": "RESPAP", "DESCRIPCION": "Resma de Papel Carta", "U. MEDIDA": 1, "CANTIDAD": 10, "PRECIO U.": 25000, "IVA": 19, "DCTO.": 0.1, "TOTAL": 225000 },
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
