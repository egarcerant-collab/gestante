import Link from 'next/link';
import Image from 'next/image';

const logoBase64 = "data:image/png;base64,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";

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <img src={logoBase64} alt="DISTRIBUIDORA MILADYS SOLANO" width={40} height={40} className="rounded-full" />
              <h1 className="ml-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                DISTRIBUIDORA MILADYS SOLANO
              </h1>
            </Link>
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
