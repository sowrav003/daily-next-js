import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory ERP | Smart Inventory Management",
  description: "Production-ready ERP system for managing products, stock, suppliers, and purchase orders with real-time supplier API integration.",
  keywords: "ERP, inventory management, supplier integration, purchase orders, stock management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
