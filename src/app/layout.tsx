import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppLayoutWrapper } from '@/components/layout/app-layout-wrapper'
import { createClient } from '@/utils/supabase/server'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: 'ConnectaYa — Envíos Masivos por WhatsApp',
    template: '%s | ConnectaYa',
  },
  description: 'Plataforma profesional de envíos masivos por WhatsApp con personalización IA, segmentación por etiquetas y reportes en tiempo real.',
  icons: {
    icon: '/icon-512.png',
    apple: '/icon-512.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userInitial = '?'
  let userName = 'Invitado'
  let userRole = 'user'

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    userName = profile?.full_name || user.email || 'Admin'
    userInitial = userName.charAt(0).toUpperCase()
    userRole = profile?.role || 'user'
  }

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppLayoutWrapper userInitial={userInitial} userName={userName} userRole={userRole}>
           {children}
        </AppLayoutWrapper>
      </body>
    </html>
  );
}
