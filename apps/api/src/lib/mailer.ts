import nodemailer from 'nodemailer';
import { env } from '../env.js';

type Mail = { to: string; subject: string; text: string };

const smtp =
  env.mail.transport === 'smtp'
    ? nodemailer.createTransport({ host: env.mail.host, port: env.mail.port, secure: false })
    : null;

// console transport keeps local dev alive without a mail server running
export async function sendMail(mail: Mail): Promise<void> {
  if (smtp) {
    await smtp.sendMail({ from: env.mail.from, ...mail });
    return;
  }
  console.log(
    ['', '--- mail ---', `to: ${mail.to}`, `subject: ${mail.subject}`, '', mail.text, '------------', ''].join('\n'),
  );
}

export function inviteMail(to: string, tenantName: string, token: string): Mail {
  const link = `${env.webUrl}/accept-invite?token=${token}`;
  return {
    to,
    subject: `You are invited to ${tenantName} on Omnes`,
    text: [
      `Someone at ${tenantName} invited you to their Omnes Inventory workspace.`,
      '',
      `Accept the invite here: ${link}`,
      '',
      'The link works for 7 days. If you were not expecting this, ignore it.',
    ].join('\n'),
  };
}

export function passwordResetMail(to: string, token: string): Mail {
  const link = `${env.webUrl}/reset-password?token=${token}`;
  return {
    to,
    subject: 'Reset your Omnes password',
    text: [
      'Someone asked to reset the password for this account.',
      '',
      `Set a new one here: ${link}`,
      '',
      'The link works for 1 hour. If this was not you, ignore it and nothing changes.',
    ].join('\n'),
  };
}
