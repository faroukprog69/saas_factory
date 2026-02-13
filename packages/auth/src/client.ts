import { createAuthClient } from "better-auth/react";

export const authClient = (baseURL: string) =>
  createAuthClient({
    baseURL,
  });
