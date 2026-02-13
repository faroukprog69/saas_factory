import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function generateTeamSlug(name: string) {
  const base = slugify(name);
  return `${base}-${nanoid()}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export async function getMembershipWithTeam(
  tx: any,
  teamId: string,
  userId: string,
  teamMember: any,
) {
  const result = await tx.query.teamMember.findFirst({
    where: and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)),
    with: {
      team: true,
    },
  });
  return result;
}
