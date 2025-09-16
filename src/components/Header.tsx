import { HeartPulse } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          <HeartPulse className="h-7 w-7 text-primary" />
          <h1 className="ml-3 text-2xl font-bold tracking-tight text-foreground">
            PregnaData Insights
          </h1>
        </div>
      </div>
    </header>
  );
}
