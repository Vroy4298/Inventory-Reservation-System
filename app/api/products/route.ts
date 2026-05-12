import db from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const products = await db.product.findMany({
    include: {
      stockLevels: {
        include: { warehouse: true }
      }
    }
  })

  const data = products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    description: p.description,
    stock: p.stockLevels.map(s => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      available: s.total - s.reserved,
      total: s.total
    }))
  }))

  return NextResponse.json({ data })
}
