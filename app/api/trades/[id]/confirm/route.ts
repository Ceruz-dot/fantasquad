// app/api/trades/[id]/confirm/route.ts

import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const trade = await prisma.tradeProposal.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!trade || trade.status !== "PENDING")
    throw new Error("Invalid trade");

  const ops: any[] = [];

  for (const item of trade.items) {
    if (item.type === "PLAYER") {
      const ownership = await prisma.playerOwnership.findFirst({
        where: {
          playerId: item.playerId!,
          teamId: item.fromTeamId,
          endDate: null,
        },
      });

      ops.push(
        prisma.playerOwnership.update({
          where: { id: ownership!.id },
          data: { endDate: new Date() },
        })
      );

      ops.push(
        prisma.playerOwnership.create({
          data: {
            playerId: item.playerId!,
            teamId: item.toTeamId,
          },
        })
      );
    }

    if (item.type === "CASH") {
      ops.push(
        prisma.team.update({
          where: { id: item.fromTeamId },
          data: { budget: { decrement: item.cashAmount! } },
        })
      );

      ops.push(
        prisma.team.update({
          where: { id: item.toTeamId },
          data: { budget: { increment: item.cashAmount! } },
        })
      );
    }
  }

  ops.push(
    prisma.tradeProposal.update({
      where: { id: trade.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    })
  );

  await prisma.$transaction(ops);

  return Response.json({ success: true });
}