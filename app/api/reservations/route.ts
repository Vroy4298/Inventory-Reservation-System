import db from "@/lib/prisma"
import { reserveSchema } from "@/lib/schemas"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = reserveSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: "bad input" }, { status: 400 })
    }

    const { productId: pid, warehouseId: wid, quantity: q } = parsed.data

    try {
        const r = await db.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<{ id: string; total: number; reserved: number }[]>`
                SELECT id, total, reserved FROM "StockLevel"
                WHERE "productId" = ${pid} AND "warehouseId" = ${wid}
                FOR UPDATE
            `

            console.log("got lock, checking stock...")

            if (!rows.length) throw new Error("NO_STOCK_RECORD")

            const s = rows[0]
            const avail = s.total - s.reserved

            if (avail <= 0 || avail < q) throw new Error("INSUFFICIENT")

            await tx.stockLevel.update({
                where: { productId_warehouseId: { productId: pid, warehouseId: wid } },
                data: { reserved: { increment: q } }
            })

            const exp = new Date(Date.now() + 10 * 60 * 1000)

            const reservation = await tx.reservation.create({
                data: { productId: pid, warehouseId: wid, quantity: q, expiresAt: exp }
            })

            return reservation
        }, { timeout: 8000 })

        return NextResponse.json(r, { status: 201 })
    } catch (e: any) {
        if (e.message === "INSUFFICIENT" || e.message === "NO_STOCK_RECORD") {
            return NextResponse.json({ error: "not enough stock" }, { status: 409 })
        }
        if (e.code === "P2028") {
            return NextResponse.json({ error: "not enough stock" }, { status: 409 })
        }
        console.error(e)
        return NextResponse.json({ error: "server error" }, { status: 500 })
    }
}
