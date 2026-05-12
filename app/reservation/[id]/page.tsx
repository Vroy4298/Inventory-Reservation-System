"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

type Res = {
  id:string
  productId: string
  warehouseId:string
  quantity: number
  status: "PENDING" | "CONFIRMED" | "RELEASED"
  expiresAt:string
  confirmedAt: string | null
  releasedAt: string | null
  product: { name: string; price: number }
  warehouse: { name: string }
}

export default function ReservationPage({ params }: { params: { id: string } }) {
  const [res, setRes] = useState<Res | null>(null)
  const [secs,setSecs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionErr, setActionErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/reservations/${params.id}`)
      .then(r => r.json())
      .then(d => { setRes(d); setLoading(false) })
  }, [params.id])

  useEffect(() => {
    if (!res || res.status !== "PENDING") return
    const calc = () => {
      const diff = Math.round((new Date(res.expiresAt).getTime() - Date.now()) / 1000)
      setSecs(Math.max(0, diff))
    }

    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [res])

  async function confirm() {
       setBusy(true)
     setActionErr(null)
      const r = await fetch(`/api/reservations/${params.id}/confirm`, { method: "POST" })
    const d = await r.json()

    if (r.status === 410) {
      setActionErr("Reservation expired — you were too slow!")
      setRes(prev => prev ? { ...prev, status: "RELEASED" } : prev)
      setBusy(false)
      return
    }
    if (!r.ok) {
      setActionErr("Something went wrong")
      setBusy(false)
      return
    }
    setRes(d)
    setBusy(false)
  }

  async function cancel() {
    setBusy(true)
    setActionErr(null)
    const r = await fetch(`/api/reservations/${params.id}/release`, { method: "POST" })

    if (!r.ok) {
      setActionErr("Could not cancel")
      setBusy(false)
      return
    }
    setRes(prev => prev ? { ...prev, status: "RELEASED", releasedAt: new Date().toISOString() } : prev)
    setBusy(false)
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  if (loading) return <p className="text-gray-500 mt-10">Loading...</p>
  if (!res) return <p className="text-red-500 mt-10">Reservation not found</p>

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reservation</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500">Product</p>
          <p className="font-semibold">{res.product.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Warehouse</p>
          <p className="font-semibold">{res.warehouse.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Quantity</p>
          <p className="font-semibold">{res.quantity}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total</p>
          <p className="font-semibold">${(res.product.price * res.quantity).toFixed(2)}</p>
        </div>

        <div className="border-t pt-4">
          {res.status === "PENDING" && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 mb-1">Expires in</p>
              <p className={`text-3xl font-mono font-bold ${secs < 60 ? "text-red-500" : "text-gray-800"}`}>
                {fmt(secs)}
              </p>
              {secs === 0 && <p className="text-red-500 text-sm mt-1">Reservation has expired</p>}
            </div>
          )}

          {res.status === "CONFIRMED" && (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm font-medium">
              ✓ Payment confirmed — order placed!
            </div>
          )}

          {res.status === "RELEASED" && (
            <div className="bg-gray-100 border border-gray-200 rounded p-3 text-gray-600 text-sm">
              Reservation cancelled or expired.
            </div>
          )}

          {actionErr && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {actionErr}
            </div>
          )}

          {res.status === "PENDING" && secs > 0 && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirm}
                disabled={busy}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {busy ? "..." : "Confirm Purchase"}
              </button>
              <button
                onClick={cancel}
                disabled={busy}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-400 text-center">ID: {res.id}</p>
    </div>
  )
}
