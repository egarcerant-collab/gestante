import { Header } from "@/components/Header";
import { QuoteTable } from "@/components/quote/QuoteTable";

export default function QuotePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Cotización</h2>
          <QuoteTable />
        </div>
      </main>
    </div>
  );
}
