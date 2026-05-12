import db from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const warehouses = await db.warehouse.findMany()
    return NextResponse.json(warehouses)
}
