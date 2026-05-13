import db from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const secret = req.headers.get("x-cron-secret")
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const now = new Date()

    const expired = await db.reservation.findMany({
        where: { status: "PENDING", expiresAt: { lt: now } }
    })

    if (!expired.length) {
        return NextResponse.json({ released: 0 })
    }

    let count = 0

    for (const r of expired) {
        try {
            await db.$transaction(async (tx) => {
                await tx.reservation.update({
                    where: { id: r.id },
                    data: { status: "RELEASED", releasedAt: now }
                })
                await tx.stockLevel.update({
                    where: { productId_warehouseId: { productId: r.productId, warehouseId: r.warehouseId } },
                    data: { reserved: { decrement: r.quantity } }
                })
            })
            count++
        } catch (e) {
            console.error("failed to release", r.id, e)
        }
    }

    return NextResponse.json({ released: count })
}
