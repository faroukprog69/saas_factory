import { createAuthClient } from "better-auth/react";

const clients = new Map<string, ReturnType<typeof createAuthClient>>();
export const authClient = (baseURL: string) => {
  if (!clients.has(baseURL))
    clients.set(baseURL, createAuthClient({ baseURL }));
  return clients.get(baseURL)!;
};
