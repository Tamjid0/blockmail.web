import type { Metadata } from "next";
import "./globals.css";
import { AuthErrorCatcher } from "@/components/auth-error-catcher";

export const metadata: Metadata = {
  title: "Blockmail - Disposable Email Detection API",
  description:
    "Block disposable and temporary emails from your signup flows with our powerful 6-tier verification engine.",
  keywords: ["email validation", "disposable email", "temp email", "email verification API"],
  openGraph: {
    title: "Blockmail - Disposable Email Detection API",
    description:
      "Block disposable and temporary emails from your signup flows with our powerful 6-tier verification engine.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthErrorCatcher />
        {children}
      </body>
    </html>
  );
}
