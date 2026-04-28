// app/api/renewals/confirm/route.ts

import { prisma } from "@/lib/prisma";
import { calculateAge, getRenewalCost } from "@/lib/utils";

export async function POST(req: Request) {
  const { teamId, season, selectedIds } = await req.json();

  const players = await prisma.playerOwnership.findMany({
    where: { teamId, endDate: null },
    include: { player: true },
  });

  let totalCost = 0;
  const renewals: any[] = [];
  const toRemove: any[] = [];

  for (const p of players) {
    const age = calculateAge(p.player.dateOfBirth);
    const value = p.player.currentValue || 0;

    const { cost, isFree } = getRenewalCost(value, age);

    if (age <= 23 || selectedIds.includes(p.id)) {
      renewals.push({ p, cost, isFree });
      if (!isFree) totalCost += cost;
    } else {
      toRemove.push(p);
    }
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if ((team?.budget || 0) < totalCost)
    throw new Error("Budget insufficiente");

  await prisma.$transaction([
    ...renewals.map((r) =>
      prisma.renewal.create({
        data: {
          ownershipId: r.p.id,
          season,
          playerValue: r.p.player.currentValue || 0,
          renewalCost: r.cost,
          isFree: r.isFree,
        },
      })
    ),
    prisma.team.update({
      where: { id: teamId },
      data: { budget: { decrement: totalCost } },
    }),
    ...toRemove.map((p) =>
      prisma.playerOwnership.update({
        where: { id: p.id },
        data: { endDate: new Date() },
      })
    ),
  ]);

  return Response.json({ success: true });
}