import { expect } from '@playwright/test';
import * as cheerio from 'cheerio';

type MessageSummary = { ID: string; To: Array<{ Address: string }>; Subject: string; Created: string };
type DeliveredMessage = { to: string; subject: string; html: string };

/**
 * Outside production the API delivers every message to a rewritten address
 * (`server/lib/email.ts` in the API) and prefixes the subject with `[TESTING]`.
 */
const deliveredAddress = (email: string) => `emailbcc+${email.replace(/@/g, '-at-')}@opencollective.com`;

/**
 * Reads the shared Mailpit inbox for one test attempt. The inbox is never
 * cleared and holds mail from other attempts, retries and earlier runs, so a
 * message only counts when it was delivered to the exact recipient after this
 * attempt started, and when no second message fits the same description.
 * Always look up an address owned by the attempt: a recipe actor's email or
 * one minted with `address()`.
 */
export class Mailbox {
  /** How long each awaited message took to arrive, for attributable timings. */
  readonly timings: Array<{ to: string; subject: string; waitMs: number }> = [];
  private readonly url: string;
  private readonly openedAt = Date.now();

  constructor(private readonly nonce: string) {
    if (!process.env.MAILPIT_URL) {
      throw new Error('Mail assertions require MAILPIT_URL. Run test/playwright/run-local.sh (or --reuse).');
    }
    this.url = process.env.MAILPIT_URL.replace(/\/$/, '');
  }

  /** An address nobody else has: for people who have no account before the journey invites them. */
  address(label: string) {
    return `testuser+pw-${this.nonce.replace(/-/g, '').slice(0, 24)}-${label}@opencollective.com`;
  }

  private async get(path: string) {
    const response = await fetch(`${this.url}${path}`, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      throw new Error(`Mailpit answered ${response.status} for ${path}`);
    }
    return response.json();
  }

  private async delivered(to: string, subject: string): Promise<MessageSummary[]> {
    const recipient = deliveredAddress(to);
    const query = new URLSearchParams({ query: `to:"${recipient}"`, limit: '200' });
    const { messages }: { messages: MessageSummary[] } = await this.get(`/api/v1/search?${query}`);
    return messages.filter(
      message =>
        message.To.some(({ Address }) => Address === recipient) &&
        message.Subject.includes(subject) &&
        // Mailpit runs on the same machine and clock, and records when it received the message to the millisecond.
        Date.parse(message.Created) >= this.openedAt,
    );
  }

  /**
   * Waits until exactly `count` messages sent to `to` during this attempt have a subject containing
   * `subject`, for a journey that asks the product to send the same message again.
   */
  async waitForMessageCount({ to, subject, count }: { to: string; subject: string; count: number }) {
    await expect
      .poll(async () => (await this.delivered(to, subject)).length, {
        message: `Expected ${count} messages with a subject containing "${subject}" delivered to ${to}`,
        timeout: 30_000,
        intervals: [100, 250, 500],
      })
      .toBe(count);
  }

  /**
   * Waits for the one message sent to `to` during this attempt whose subject
   * contains `subject`. Pass the most specific subject the product sends
   * (it usually names an Account of the scenario).
   */
  async waitForMessage({
    to,
    subject,
    timeout = 30_000,
  }: {
    to: string;
    subject: string;
    timeout?: number;
  }): Promise<DeliveredMessage> {
    const startedAt = performance.now();
    let found: MessageSummary[] = [];
    await expect
      .poll(async () => (found = await this.delivered(to, subject)).length, {
        message: `No message with a subject containing "${subject}" was delivered to ${to} during this attempt`,
        timeout,
        intervals: [100, 250, 500],
      })
      .toBeGreaterThan(0);
    this.timings.push({ to, subject, waitMs: Math.round(performance.now() - startedAt) });
    if (found.length > 1) {
      throw new Error(
        `${found.length} messages with a subject containing "${subject}" were delivered to ${to}: match more specifically.`,
      );
    }
    const message = await this.get(`/api/v1/message/${found[0].ID}`);
    return { to, subject: message.Subject, html: message.HTML };
  }
}

/** Path of the link with this exact text in a message, relative to the site the journey runs against. */
function linkIn(message: DeliveredMessage, text: string): string {
  const $ = cheerio.load(message.html);
  const href = $('a')
    .filter((_, link) => $(link).text().trim() === text)
    .first()
    .attr('href');
  if (!href) {
    throw new Error(`The message "${message.subject}" has no "${text}" link`);
  }
  const url = new URL(href);
  return `${url.pathname}${url.search}`;
}

/**
 * The link an invited payee receives to complete an expense for `account`.
 * `to` is the invited person, or the admin of the invited Organization.
 */
export async function expenseInvitationLink(
  mail: Mailbox,
  { to, account }: { to: string; account: { name: string; slug: string } },
): Promise<string> {
  // The subject starts with the paying Account: "<account> wants to pay you" to a person,
  // "<account> wants to send funds to <payee>" to an Organization.
  const message = await mail.waitForMessage({ to, subject: `${account.name} wants to ` });
  const link = linkIn(message, "OK, let's go!");
  expect(link, 'The invitation must lead to an expense of the inviting Account').toMatch(
    new RegExp(`^/${account.slug}/expenses/\\d+\\?key=`),
  );
  return link;
}

/**
 * The one-click link the product emails to someone who asks to sign in with
 * their address `to`, as a path relative to the site.
 */
export async function emailedSignInLink(mail: Mailbox, { to }: { to: string }): Promise<string> {
  const message = await mail.waitForMessage({ to, subject: 'Open Collective: Sign In' });
  return linkIn(message, 'One-click Sign In');
}

/**
 * The invitation to join `account`'s team the product emails to `to`: its text, and the link to the invitation
 * (through sign-up for someone without an account) as a path relative to the site.
 */
export async function memberInvitation(
  mail: Mailbox,
  { to, account }: { to: string; account: { name: string } },
): Promise<{ text: string; link: string }> {
  const message = await mail.waitForMessage({ to, subject: `Invitation to join ${account.name} on Open Collective` });
  const $ = cheerio.load(message.html);
  const label = $('a').filter((_, link) =>
    ['Sign up and view invitation', 'View invitation'].includes($(link).text().trim()),
  );
  const href = label.first().attr('href');
  if (!href) {
    throw new Error(`The message "${message.subject}" has no invitation link`);
  }
  const url = new URL(href);
  return { text: $('body').text(), link: `${url.pathname}${url.search}${url.hash}` };
}

/** The link the product emails to `to` after they asked to reset their password, as a path relative to the site. */
export async function emailedResetPasswordLink(mail: Mailbox, { to }: { to: string }): Promise<string> {
  const message = await mail.waitForMessage({ to, subject: 'Reset Password' });
  return linkIn(message, 'Reset your password now');
}

/**
 * The message asking to confirm `newEmail` as the new address of an account, sent to that address, and its
 * confirmation link as a path relative to the site.
 */
export async function emailChangeConfirmation(
  mail: Mailbox,
  { newEmail }: { newEmail: string },
): Promise<{ text: string; link: string }> {
  const message = await mail.waitForMessage({ to: newEmail, subject: `Confirm your email ${newEmail}` });
  return { text: cheerio.load(message.html)('body').text(), link: linkIn(message, 'Confirm Email') };
}
