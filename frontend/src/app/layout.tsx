import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/index.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JTalk AI - Luyện nói tiếng Nhật cùng AI cho sinh viên & người đi làm",
  description:
    "Luyện nói tiếng Nhật cùng AI Sensei chuẩn giọng Tokyo. Kịch bản phỏng vấn Baito Combini, IT BrSE, và chấm điểm chi tiết 4 tiêu chí.",
  keywords: [
    "jtalk ai",
    "học tiếng nhật",
    "luyện nói tiếng nhật ai",
    "giao tiếp tiếng nhật",
    "phỏng vấn baito",
  ],
  authors: [{ name: "JTalk AI Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "JTalk AI - Luyện nói tiếng Nhật cùng AI cho sinh viên & người đi làm",
    description:
      "Luyện nói tiếng Nhật cùng AI Sensei chuẩn giọng Tokyo. Kịch bản phỏng vấn Baito Combini, IT BrSE.",
    url: "https://jtalk.vn",
    siteName: "JTalk AI",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={plusJakartaSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 min-h-screen">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
