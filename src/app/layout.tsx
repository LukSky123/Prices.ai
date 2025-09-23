import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prices.ai",
  description: "Track food prices across markets in Nigeria",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/40">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">Prices.ai</Link>
            <div className="flex items-center gap-6 text-sm text-slate-200">
              <Link className="hover:text-white" href="/">Dashboard</Link>
              <Link className="hover:text-white" href="/markets">Markets</Link>
              <Link className="hover:text-white" href="/about">About</Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Prices.ai
        </footer>
      </body>
    </html>
  );
}



