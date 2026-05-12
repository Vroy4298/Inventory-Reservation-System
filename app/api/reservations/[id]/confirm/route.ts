import db from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params

    const res = await db.reservation.findUnique({ where: { id } })

    if (!res) {
        return NextResponse.json({ error: "not found" }, { status: 404 })
    }

    if (res.status !== "PENDING") {
        return NextResponse.json({ error: "reservation is not pending" }, { status: 400 })
    }

    if (new Date() > res.expiresAt) {
        await db.reservation.update({ where: { id }, data: { status: "RELEASED", releasedAt: new Date() } })
        await db.stockLevel.update({
            where: { productId_warehouseId: { productId: res.productId, warehouseId: res.warehouseId } },
            data: { reserved: { decrement: res.quantity } }
        })
        return NextResponse.json({ error: "reservation expired" }, { status: 410 })
    }

    await db.$transaction(async (tx) => {
        await tx.reservation.update({
            where: { id },
            data: { status: "CONFIRMED", confirmedAt: new Date() }
        })

        await tx.stockLevel.update({
            where: { productId_warehouseId: { productId: res.productId, warehouseId: res.warehouseId } },
            data: {
                reserved: { decrement: res.quantity },
                total: { decrement: res.quantity }
            }
        })
    })

    const updated = await db.reservation.findUnique({
        where: { id },
        include: { product: true, warehouse: true }
    })
    return NextResponse.json(updated)
}
