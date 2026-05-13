import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const w1 = await prisma.warehouse.create({
    data: { name: "Mumbai Central", location: "Mumbai, MH" }
  })
  const w2 = await prisma.warehouse.create({
    data: { name: "Delhi North", location: "Delhi, DL" }
  })

  const products = [
    { name: "iPhone 15 Pro", sku: "IPH15PRO", price: 999, description: "Apple iPhone 15 Pro 256GB" },
    { name: "Samsung S24", sku: "SAMS24", price: 849, description: "Samsung Galaxy S24 128GB" },
    { name: "Sony WH-1000XM5", sku: "SONYWH5", price: 349, description: "Sony noise cancelling headphones" },
    { name: "MacBook Air M3", sku: "MBAIRM3", price: 1299, description: "Apple MacBook Air 13 inch M3" },
    { name: "iPad Mini 6", sku: "IPADMINI6", price: 499, description: "Apple iPad Mini 6th gen" },
  ]

  for (const p of products) {
    const prod = await prisma.product.create({ data: p })

    const stockMum = p.sku === "SONYWH5" ? 1 : 10
    const stockDel = p.sku === "SONYWH5" ? 2 : 8

    await prisma.stockLevel.create({
      data: { productId: prod.id, warehouseId: w1.id, total: stockMum, reserved: 0 }
    })
    await prisma.stockLevel.create({
      data: { productId: prod.id, warehouseId: w2.id, total: stockDel, reserved: 0 }
    })
  }

  console.log("seeded")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
