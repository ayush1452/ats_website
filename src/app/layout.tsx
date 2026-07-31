import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { productConfig } from "@/config/product";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(productConfig.domain),
  title: {
    default: `${productConfig.name} — Resume analysis with evidence`,
    template: `%s — ${productConfig.name}`,
  },
  description: productConfig.description,
  openGraph: {
    type: "website",
    siteName: productConfig.name,
    title: `${productConfig.name} — Resume analysis with evidence`,
    description: productConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: productConfig.name,
    description: productConfig.description,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f6f8f5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              border: "1px solid var(--border)",
              borderRadius: "14px",
              color: "var(--text)",
            },
          }}
        />
      </body>
    </html>
  );
}
