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
        // Same machine as the mail server; the margin only absorbs timestamp rounding.
        Date.parse(message.Created) >= this.openedAt - 1000,
    );
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
  const message = await mail.waitForMessage({ to, subject: `wants to send funds to ${account.name}` });
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
