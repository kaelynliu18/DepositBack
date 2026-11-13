import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DepositBack — get your security deposit back",
  description: "AI agents review your landlord's deposit deductions and finish the job: letter, email, reminder.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white font-sans text-ink">{children}</body>
    </html>
  );
}
