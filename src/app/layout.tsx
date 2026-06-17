import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Phone Fix SEO Agent',
  description: 'מערכת SEO אוטומטית לתיקון טלפונים',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
