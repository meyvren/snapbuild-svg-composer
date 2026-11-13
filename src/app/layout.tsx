import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snapbuild — SVG-компоновщик",
  description: "Собирайте, редактируйте и экспортируйте иллюстрации из SVG-библиотеки Snapbuild.",
  icons: { icon: "/mark.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
