import { Auth, createAuth } from "@faroukprog69/auth";
import { db } from "./db";
import { schema } from "./schema";
import { logAudit } from "./audit";
import { teamsService } from "./teams";

export const auth: Auth = createAuth(db, schema, {
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await logAudit({
            id: crypto.randomUUID(),
            actorId: session.userId,
            actorType: "user",
            entityType: "session",
            entityId: session.id,
            targetId: session.userId,
            targetType: "user",
            action: "session_created",
          });
          const result = await teamsService.createTeamForUser(
            session.userId,
            `Team of ${session.userId}`,
          );
        },
      },
    },
  },
});
