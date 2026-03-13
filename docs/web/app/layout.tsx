import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zero Context Protocol",
  description: "The Zero Context Protocol docs surface: MCP-compatible mode, native ZCP mode, and benchmark evidence sourced from the Python SDK repository.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
