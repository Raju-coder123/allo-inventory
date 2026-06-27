import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json({ error: "Reservation is not pending" }, { status: 400 });
    }

    if (new Date() > reservation.expiresAt) {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id },
          data: { status: "RELEASED" },
        });
        await tx.$executeRaw`
          UPDATE "Stock"
          SET reserved = reserved - ${reservation.quantity}
          WHERE "productId" = ${reservation.productId}
          AND "warehouseId" = ${reservation.warehouseId}
        `;
      });
      return NextResponse.json({ error: "Reservation has expired" }, { status: 410 });
    }

    const confirmed = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: { product: true, warehouse: true },
      });
      await tx.$executeRaw`
        UPDATE "Stock"
        SET total = total - ${reservation.quantity},
            reserved = reserved - ${reservation.quantity}
        WHERE "productId" = ${reservation.productId}
        AND "warehouseId" = ${reservation.warehouseId}
      `;
      return updated;
    });

    return NextResponse.json(confirmed);
  } catch (err) {
    console.error("Confirm error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}