// packages/mail/src/index.ts
import { Resend } from "resend";
import { render } from "@react-email/render";
import { ReactElement } from "react";
import { ValidationError } from "@faroukprog69/errors";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  component: ReactElement;
}

export const createMailClient = (config: { apiKey: string; from: string }) => {
  if (!config.apiKey) throw new ValidationError({ apiKey: "missing" });

  const resend = new Resend(config.apiKey);

  return {
    send: async (options: SendEmailOptions) => {
      const html = await render(options.component);
      const text = await render(options.component, { plainText: true });

      return resend.emails.send({
        from: config.from,
        to: options.to,
        subject: options.subject,
        html,
        text,
      });
    },
  };
};

export type MailClient = ReturnType<typeof createMailClient>;
