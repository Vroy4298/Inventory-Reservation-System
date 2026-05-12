import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Inventory Reservation",
  description: "Reserve products across warehouses",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <a href="/" className="font-semibold text-lg">Allo Inventory</a>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
