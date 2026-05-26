import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataOps Copilot | AI 数据运营分析工作台",
  description: "面向数据分析、数据运营、产品运营和产品经理面试展示的数据运营分析工作台"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
