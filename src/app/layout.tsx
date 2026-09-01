import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sumz — AI Article Summarizer",
  description: "Paste an article URL and get an AI-generated summary in seconds.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-fredoka" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
