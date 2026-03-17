import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const serifFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const uiFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Commonplace",
  description: "Web interface for Markdown vaults with collaborative comments and editing. Compatible with the core Obsidian Markdown format.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${serifFont.variable} ${uiFont.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme') || 'system';
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (theme === 'system' && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
