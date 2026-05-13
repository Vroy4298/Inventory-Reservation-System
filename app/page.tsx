"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Stock = {
  warehouseId: string
  warehouseName: string
  available: number
  total: number
}

type Product = {
  id: string
  name: string
  sku: string
  price: number
  description: string | null
  stock: Stock[]
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number | string>>({})
  const router = useRouter()

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => { setProducts(d.data); setLoading(false) })
  }, [])

  async function reserve(pid: string, wid: string, wname: string) {
    const stockKey = `${pid}-${wid}`
    setReserving(stockKey)
    setErr(null)

    const rawQ = quantities[stockKey]
    const q = typeof rawQ === "number" ? rawQ : 1

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: pid, warehouseId: wid, quantity: q })
    })

    const data = await res.json()

    if (res.status === 409) {
      setErr(`Not enough stock at ${wname}`)
      setReserving(null)
      return
    }

    if (!res.ok) {
      setErr("Something went wrong, try again")
      setReserving(null)
      return
    }

    router.push(`/reservation/${data.id}`)
  }

  if (loading) return <p className="text-gray-500 mt-10">Loading products...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      {err && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {err}
        </div>
      )}

      <div className="space-y-4">
        {products.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-semibold text-lg">{p.name}</h2>
                <p className="text-sm text-gray-500">SKU: {p.sku}</p>
                {p.description && <p className="text-sm text-gray-600 mt-1">{p.description}</p>}
              </div>
              <span className="font-bold text-lg">${p.price}</span>
            </div>

            <div className="border-t pt-3 space-y-2">
              {p.stock.map(s => {
                const stockKey = `${p.id}-${s.warehouseId}`
                const q = quantities[stockKey] !== undefined ? quantities[stockKey] : 1
                return (
                <div key={s.warehouseId} className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{s.warehouseName}</span>
                    <span className={`ml-2 ${s.available === 0 ? "text-red-500" : "text-green-600"}`}>
                      {s.available} available
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={s.available}
                      value={q}
                      onChange={(e) => {
                        const val = e.target.value
                        setQuantities(prev => ({ ...prev, [stockKey]: val === "" ? "" : parseInt(val) }))
                      }}
                      className="border border-gray-300 rounded px-2 py-1 w-16 text-sm"
                      disabled={s.available === 0}
                    />
                    <button
                      disabled={s.available === 0 || reserving === stockKey || typeof q === "string" || q > s.available || q < 1}
                      onClick={() => reserve(p.id, s.warehouseId, s.warehouseName)}
                      className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reserving === stockKey ? "..." : s.available === 0 ? "Out of stock" : "Reserve"}
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
