import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReserveSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ReserveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { productId, warehouseId, quantity } = parsed.data;

  try {
    // Use raw SQL with SELECT FOR UPDATE to prevent race conditions
    const reservation = await prisma.$transaction(async (tx: any) => {
      // Lock the stock row so no other transaction can read/modify it simultaneously
  const stocks = await tx.$queryRaw<
  { id: string; total: number; reserved: number }[]
>`
SELECT id, total, reserved
FROM "Stock"
WHERE "productId" = ${productId}
AND "warehouseId" = ${warehouseId}
FOR UPDATE
`;

      const stock = stocks[0];

      if (!stock) {
        throw new Error("STOCK_NOT_FOUND");
      }

      const available = stock.total - stock.reserved;

      if (available < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // Increment reserved count
      await tx.$executeRaw`
        UPDATE "Stock"
        SET reserved = reserved + ${quantity}
        WHERE id = ${stock.id}
      `;

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const newReservation = await tx.reservation.create({
        data: { productId, warehouseId, quantity, expiresAt, status: "PENDING" },
        include: { product: true, warehouse: true },
      });

      return newReservation;
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Not enough stock available" }, { status: 409 });
    }
    if (err.message === "STOCK_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found in warehouse" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}