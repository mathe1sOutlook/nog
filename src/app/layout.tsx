import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

const manrope = Manrope({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nog - Conferencia de Repasses',
  description: 'Sistema para conferencia de repasses medicos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${jetbrainsMono.variable} antialiased`}>
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
