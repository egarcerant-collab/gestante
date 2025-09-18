
import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cotizador',
  description: 'Generado por Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" async></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

    