// src/app/layout.tsx
import "./globals.css";
import Providers from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";

// ✅ Metadata IZVAN client komponente
export const metadata = {
  title: "Beauty Lab by Irena",
  description: "Salon ljepote, manikura, pedikura, depilacija i edukacije.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="bg-porcelain font-body text-graphite">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
