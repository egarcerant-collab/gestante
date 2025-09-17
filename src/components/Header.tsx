import { Calculator } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Calculator className="h-7 w-7 text-primary" />
            <h1 className="ml-3 text-2xl font-bold tracking-tight text-foreground">
              <Link href="/">Cotizador</Link>
            </h1>
          </div>
          <nav>
            <ul className="flex items-center gap-4">
              <li><Link href="/" className="text-sm font-medium hover:text-primary">Dashboard</Link></li>
              <li><Link href="/quote" className="text-sm font-medium hover:text-primary">Cotización</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
