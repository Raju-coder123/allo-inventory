import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create warehouses
  const mumbai = await prisma.warehouse.create({
    data: { name: "Mumbai Hub", location: "Mumbai, Maharashtra" },
  });
  const delhi = await prisma.warehouse.create({
    data: { name: "Delhi Hub", location: "Delhi, NCR" },
  });

  // Create products with stock
  const products = [
    { name: "Wireless Headphones", description: "Noise cancelling bluetooth headphones", price: 2999, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" },
    { name: "Mechanical Keyboard", description: "RGB mechanical gaming keyboard", price: 4499, imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400" },
    { name: "USB-C Hub", description: "7-in-1 multiport USB-C adapter", price: 1299, imageUrl: "https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=400" },
    { name: "Webcam HD", description: "1080p HD webcam with mic", price: 1999, imageUrl: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400" },
  ];

  for (const p of products) {
    const product = await prisma.product.create({ data: p });
    await prisma.stock.create({
      data: { productId: product.id, warehouseId: mumbai.id, total: 10, reserved: 0 },
    });
    await prisma.stock.create({
      data: { productId: product.id, warehouseId: delhi.id, total: 5, reserved: 0 },
    });
  }

  console.log("✅ Database seeded!");
}

main().catch(console.error).finally(() => prisma.$disconnect());