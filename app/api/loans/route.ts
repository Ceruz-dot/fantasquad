// app/api/loans/route.ts

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const data = await req.json();

  const ownership = await prisma.playerOwnership.findFirst({
    where: {
      playerId: data.playerId,
      teamId: data.fromTeamId,
      endDate: null,
    },
  });

  return prisma.$transaction([
    prisma.playerOwnership.update({
      where: { id: ownership!.id },
      data: { endDate: new Date() },
    }),
    prisma.playerOwnership.create({
      data: {
        playerId: data.playerId,
        teamId: data.toTeamId,
        contractType: "LOAN",
        originTeamId: data.fromTeamId,
      },
    }),
    prisma.loan.create({ data }),
  ]);
}