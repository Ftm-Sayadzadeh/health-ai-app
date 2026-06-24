import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health AI App",
  description: "زیرساخت اولیه محصول سلامت، تغذیه و سبک زندگی فارسی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
