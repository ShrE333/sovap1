import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ToastProvider } from "@/lib/contexts/ToastContext";

export const metadata: Metadata = {
  title: "SOVAP Studio - AI-Powered Adaptive Learning",
  description: "Next-generation intelligent learning platform powered by adaptive AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
