import db from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await db.reservation.findUnique({
    where: { id: params.id },
    include: { product: true, warehouse: true }
  })

  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 })

  return NextResponse.json(r)
}
