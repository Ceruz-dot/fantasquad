// app/api/renewals/preview/route.ts

import { prisma } from "@/lib/prisma";
import { calculateAge, getRenewalCost } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId")!;

  const players = await prisma.playerOwnership.findMany({
    where: { teamId, endDate: null },
    include: { player: true },
  });

  const autoRenew = [];
  const manualRenew = [];

  for (const p of players) {
    const age = calculateAge(p.player.dateOfBirth);
    const value = p.player.currentValue || 0;

    const { cost, isFree } = getRenewalCost(value, age);

    const data = {
      ownershipId: p.id,
      playerName: p.player.name,
      age,
      cost,
    };

    if (isFree) autoRenew.push(data);
    else manualRenew.push(data);
  }

  return Response.json({ autoRenew, manualRenew });
}