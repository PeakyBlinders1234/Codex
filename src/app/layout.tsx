import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataOps Copilot | AI 数据运营分析工作台",
  description: "展示 AI 如何完成数据运营分析、异常识别、报告生成和行动建议的工作台"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
