import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "WorkShelf — AI Document Assistant",
    template: "%s | WorkShelf",
  },
  description:
    "Multi-workspace AI Document Assistant powered by RAG. Upload documents, ask questions, get cited answers.",
  keywords: ["AI", "RAG", "document assistant", "workspace", "Gemini"],
  authors: [{ name: "WorkShelf" }],
  openGraph: {
    title: "WorkShelf — AI Document Assistant",
    description: "Multi-workspace AI Document Assistant powered by RAG",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>{children}</QueryProvider>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
