import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harvello",
  description: "AI Digital Front Desk demos for park districts."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
