import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="DISTRIBUIDORA MILADYS SOLANO" width={40} height={40} className="rounded-full" />
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
