import type { Page } from '@playwright/test';

import { expect, test, visitorTest } from '../../fixtures';
import { attemptTag } from '../../helpers/attempt';
import { emailedSignupCode, type Mailbox } from '../../helpers/mail';
import { toast } from '../../helpers/notifications';
import {
  exhaustSignupRateLimit,
  expectSignupStepTracked,
  expireSignupSession,
  type RedisStore,
  resetSignupRateLimits,
} from '../../helpers/redis';

const INVALID_CODE_MESSAGE = 'The OTP code is invalid or has expired.';
const SESSION_EXPIRED_MESSAGE = 'This verification link is no longer valid. Please start again.';
/** Never a real code: the API only issues digits and capital letters, with 36^6 combinations. */
const WRONG_CODES = ['AAAAAA', 'BBBBBB', 'CCCCCC'];

const signupForm = (page: Page) => page.getByTestId('signup-form');
const codeInput = (page: Page) => signupForm(page).locator('input[data-slot="input-otp"]');

/** Submits `email` on the email step, as many times as the journey needs: the field is replaced, not appended to. */
async function submitEmail(page: Page, email: string) {
  await signupForm(page).locator('input[name="email"]').fill(email);
  await signupForm(page).locator('button[type="submit"]').click();
}

/** The code challenge is open for `email`; the query string is rebuilt between steps, so only the path is checked. */
async function expectCodeStep(page: Page, email: string) {
  await expect(page).toHaveURL(url => url.pathname === '/signup/verify');
  await expect(signupForm(page)).toContainText(`Enter the code sent to ${email}.`);
  await expect(codeInput(page)).toBeVisible();
}

/** The user was sent back to request a new code. */
async function expectEmailStep(page: Page) {
  await expect(page).toHaveURL(url => url.pathname === '/signup');
  await expect(signupForm(page).locator('input[name="email"]')).toBeVisible();
}

/**
 * Types a full code, which submits it, and waits for the API's answer: a toast of an earlier code can still be on
 * screen, so it does not tell that this one was handled. The input keeps a rejected code, so it is cleared first.
 */
async function enterCode(page: Page, code: string) {
  await codeInput(page).fill('');
  const verified = page.waitForResponse(response => response.url().endsWith('/api/users/verify-email'));
  await codeInput(page).pressSequentially(code);
  await verified;
}

/** One error toast with this message is on screen. */
async function expectErrorToast(page: Page, message: string) {
  await expect(toast(page, message)).toHaveCount(1);
  await expect(toast(page, message)).toHaveAttribute('data-variant', 'error');
}

/**
 * Closes the toast with this message and waits until it is gone, so the next identical toast proves the next
 * answer was handled. Waiting for it to close on its own (about 5 s) would make the proof depend on timing.
 */
async function dismissToast(page: Page, message: string) {
  await toast(page, message).getByTestId('dismiss-toast-btn').click();
  await expect(toast(page, message)).toHaveCount(0);
}

/** Requests a code for `email` from `path` with fresh rate-limit windows, landing on the code step. */
async function requestCode(page: Page, redis: RedisStore, { path, email }: { path: string; email: string }) {
  await resetSignupRateLimits(redis);
  await page.goto(path);
  await submitEmail(page, email);
  await expectCodeStep(page, email);
  await expectSignupStepTracked(redis, 'signup');
}

/** Requests a signup for `email` from `path` and enters the code emailed to it, landing on the profile step. */
async function verifyEmail(
  { page, mail, redis }: { page: Page; mail: Mailbox; redis: RedisStore },
  { path, email, reload = false }: { path: string; email: string; reload?: boolean },
) {
  await requestCode(page, redis, { path, email });
  const onCodeStep = (url: URL) => url.pathname === '/signup/verify' && url.searchParams.get('email') === email;
  await expect(page).toHaveURL(onCodeStep);
  if (reload) {
    // The code step survives a reload.
    await page.reload();
    await expect(page).toHaveURL(onCodeStep);
    await expectCodeStep(page, email);
  }
  await enterCode(page, await emailedSignupCode(mail, { to: email }));
  await expect(page).toHaveURL(url => url.pathname === '/signup/profile');
  await expectSignupStepTracked(redis, 'verifyEmail');
}

async function completeProfile(page: Page, name: string) {
  const form = page.getByTestId('complete-profile-form');
  await expect(form.locator('h1')).toHaveText("Let's complete your profile");
  await form.locator('input[name="name"]').fill(name);
  await form.locator('button[type="submit"]').click();
}

async function fillOrganization(page: Page, { name, slug }: { name: string; slug: string }) {
  const form = page.getByTestId('create-organization-form');
  await form.locator('input[name="organization.legalName"]').fill(`${name} Inc.`);
  await form.locator('input[name="organization.name"]').fill(name);
  await form.locator('input[name="organization.description"]').fill(`What ${name} does`);
  await form.locator('input[name="organization.slug"]').fill(slug);
  // Text fields first: the Select restores focus asynchronously when it closes.
  await page.getByTestId('organization-country-trigger').click();
  await page.getByTestId('organization-country-search').fill('Puerto Rico');
  await page.getByTestId('organization-country-list').getByTestId('organization-country-PR').click();
  await expect(page.getByTestId('organization-country-trigger')).toContainText('Puerto Rico');
  await expect(page.getByTestId('organization-currency-trigger')).not.toContainText('Select currency');
  await form.locator('button[type="submit"]').click();
}

async function fillCollective(page: Page, { name, slug }: { name: string; slug: string }) {
  const form = page.getByTestId('create-collective-form');
  await form.locator('input[name="collective.name"]').fill(name);
  await form.locator('input[name="collective.description"]').fill(`A community around ${name}`);
  await form.locator('input[name="collective.slug"]').fill(slug);
  await form.locator('button[type="submit"]').click();
}

/** Invites one admin from the invite step and checks the invitation reaches them. */
async function inviteAdmin(page: Page, mail: Mailbox, invitee: { name: string; email: string }, accountName: string) {
  const form = page.getByTestId('invite-admins-form');
  await expect(form.locator('h1')).toHaveText('Invite your team');
  await page.getByTestId('add-team-member').click();
  const modal = page.getByTestId('invite-user-modal-form');
  await modal.locator('input[name="name"]').fill(invitee.name);
  await modal.locator('input[name="email"]').fill(invitee.email);
  await modal.locator('button').click();
  await form.locator('button[type="submit"]').click();
  const invitation = await mail.waitForMessage({ to: invitee.email, subject: `Invitation to join ${accountName}` });
  expect(invitation.html).toContain('just invited you to the role of Administrator of');
}

/** Opens the advanced settings of the Organization the journey just created and checks its two toggles. */
async function expectOrganizationCapabilities(page: Page, { hosting }: { hosting: boolean }) {
  await page.getByTestId('menu-item-Settings').click();
  await page.getByTestId('menu-item-advanced').click();
  await expect(page.getByTestId('money-management-section').getByRole('button')).toContainText('Deactivate');
  await expect(page.getByTestId('fiscal-hosting-section').getByRole('button')).toContainText(
    hosting ? 'Deactivate' : 'Activate',
  );
}

visitorTest.describe('Signup of a new user', () => {
  visitorTest(
    'visitor signs up, is held on profile completion until done, then reaches the dashboard',
    async ({ page, mail, recipes, redis }) => {
      await verifyEmail({ page, mail, redis }, { path: '/signup', email: mail.address('individual'), reload: true });

      // A verified user without a profile is sent back to complete it.
      for (const path of ['/signup', '/home', '/dashboard']) {
        await page.goto(path);
        await expect(page).toHaveURL(url => url.pathname === '/signup/profile');
      }

      await completeProfile(page, `Individual ${attemptTag(recipes.attempt)}`);
      await expect(page).toHaveURL(url => url.pathname.startsWith('/dashboard'));
    },
  );

  visitorTest(
    'visitor signs up with a new Organization and invites an admin to it',
    async ({ page, mail, recipes, redis }) => {
      const tag = attemptTag(recipes.attempt);
      const email = mail.address('org-admin');
      const organization = { name: `Signup Org ${tag}`, slug: `signup-org-${tag}` };

      await verifyEmail({ page, mail, redis }, { path: '/signup/organization', email });
      await expect(page).toHaveURL(url => url.searchParams.get('organization') === 'true');
      await completeProfile(page, `Org Admin ${tag}`);
      await expect(page).toHaveURL(url => url.pathname === '/signup/organization');
      await fillOrganization(page, organization);
      await inviteAdmin(page, mail, { name: `Invitee ${tag}`, email: mail.address('org-invitee') }, organization.name);
      await expect(page).toHaveURL(url => url.pathname === `/dashboard/${organization.slug}/overview`);
    },
  );

  visitorTest(
    'visitor signs up with a new Collective and invites an admin to it',
    async ({ page, mail, recipes, redis }) => {
      const tag = attemptTag(recipes.attempt);
      const email = mail.address('collective-admin');
      const collective = { name: `Signup Collective ${tag}`, slug: `signup-collective-${tag}` };

      await verifyEmail({ page, mail, redis }, { path: '/signup/collective', email });
      await expect(page).toHaveURL(url => url.searchParams.get('collective') === 'true');
      await completeProfile(page, `Collective Admin ${tag}`);
      await fillCollective(page, collective);
      await inviteAdmin(
        page,
        mail,
        { name: `Invitee ${tag}`, email: mail.address('collective-invitee') },
        collective.name,
      );
      await expect(page).toHaveURL(url => url.pathname === `/dashboard/${collective.slug}/overview`);
    },
  );
});

test.describe('Signup flows of a signed-in user', () => {
  for (const { query, label, hosting } of [
    { query: 'active=true', label: 'an Organization managing money', hosting: false },
    { query: 'host=true', label: 'a fiscal host', hosting: true },
  ]) {
    test(`signed-in user creates ${label} from the signup flow`, async ({ page, scenario }) => {
      const tag = attemptTag(scenario.attempt);
      const organization = { name: `Signup Org ${tag}`, slug: `signup-org-${tag}` };
      await page.goto(`/signup/organization?${query}`);
      await fillOrganization(page, organization);
      await page.getByTestId('skip-button').click();
      await expect(page).toHaveURL(url => url.pathname === `/dashboard/${organization.slug}/overview`);
      await expectOrganizationCapabilities(page, { hosting });
    });
  }

  test('signed-in user creates a Collective from the signup flow', async ({ page, scenario }) => {
    const tag = attemptTag(scenario.attempt);
    const collective = { name: `Signup Collective ${tag}`, slug: `signup-collective-${tag}` };
    await page.goto('/signup/collective');
    await fillCollective(page, collective);
    await page.getByTestId('skip-button').click();
    await expect(page).toHaveURL(url => url.pathname === `/dashboard/${collective.slug}/overview`);
  });
});

/**
 * Failure paths against the real API: the per-IP OTP budget that made the Cypress suite stub these responses is
 * reset before every request (`helpers/redis.ts`), and expiries are reproduced in the API's own session store.
 */
visitorTest.describe('Signup failures and redirections', () => {
  visitorTest('a wrong code shows a retryable error and keeps the code step', async ({ page, mail, redis }) => {
    const email = mail.address('wrong-code');
    await requestCode(page, redis, { path: '/signup', email });
    await enterCode(page, WRONG_CODES[0]);
    await expectErrorToast(page, INVALID_CODE_MESSAGE);
    await expectCodeStep(page, email);
  });

  visitorTest(
    'an expired verification session sends the user back to the email step',
    async ({ page, mail, redis }) => {
      const email = mail.address('expired-session');
      await requestCode(page, redis, { path: '/signup', email });
      await expireSignupSession(redis, email);
      await enterCode(page, WRONG_CODES[0]);
      await expectErrorToast(page, SESSION_EXPIRED_MESSAGE);
      await expectEmailStep(page);
    },
  );

  visitorTest('three wrong codes end the session and the same email can start over', async ({ page, mail, redis }) => {
    const email = mail.address('three-wrong-codes');
    await requestCode(page, redis, { path: '/signup', email });
    for (const code of WRONG_CODES.slice(0, 2)) {
      await enterCode(page, code);
      await expectErrorToast(page, INVALID_CODE_MESSAGE);
      await expectCodeStep(page, email);
      await dismissToast(page, INVALID_CODE_MESSAGE);
    }
    await enterCode(page, WRONG_CODES[2]);
    await expectErrorToast(page, SESSION_EXPIRED_MESSAGE);
    await expectEmailStep(page);

    // The API dropped the session, so the same address opens a new challenge right away.
    await submitEmail(page, email);
    await expectCodeStep(page, email);
  });

  visitorTest(
    'resending a code for an expired session sends the user back to the email step',
    async ({ page, mail, redis }) => {
      const email = mail.address('resend-expired');
      // Only the clock is faked, and time keeps flowing: the 30 s resend countdown is skipped, not waited out.
      await page.clock.install();
      await requestCode(page, redis, { path: '/signup', email });
      await expireSignupSession(redis, email);
      await page.clock.fastForward('00:31');
      await signupForm(page).getByRole('button', { name: 'Resend', exact: false }).click();
      await expectErrorToast(page, SESSION_EXPIRED_MESSAGE);
      await expectEmailStep(page);
      await expectSignupStepTracked(redis, 'resendOTP');
    },
  );

  visitorTest('an email that already has an account is refused on the email step', async ({ page, recipes, redis }) => {
    const { user } = await recipes.arrange('account-profile', {
      name: `Existing account ${attemptTag(recipes.attempt)}`,
    });
    await resetSignupRateLimits(redis);
    await page.goto('/signup');
    await submitEmail(page, user.email);
    await expectErrorToast(page, 'A user with this email already exists.');
    await expectEmailStep(page);
  });

  visitorTest('a rate-limited signup is refused on the email step', async ({ page, mail, redis }) => {
    try {
      // Inside `try`: a partly filled budget is given back too.
      await exhaustSignupRateLimit(redis);
      await page.goto('/signup');
      await submitEmail(page, mail.address('rate-limited'));
      await expectErrorToast(page, 'Rate limit exceeded. Please try again later.');
      await expectEmailStep(page);
    } finally {
      // Every other signup from this machine is refused until the budget is given back.
      await resetSignupRateLimits(redis);
    }
  });

  visitorTest(
    'requesting a second code while one is open is refused on the email step',
    async ({ page, mail, redis }) => {
      const email = mail.address('challenge-open');
      await requestCode(page, redis, { path: '/signup', email });
      await signupForm(page).getByRole('button', { name: 'Go Back' }).click();
      await expectEmailStep(page);
      const refused = page.waitForResponse(response => response.url().endsWith('/api/users/signup'));
      await submitEmail(page, email);
      // Any refusal shows an error toast: the API must say the challenge is still open.
      expect((await (await refused).json()).error?.type).toBe('OTP_REQUEST_EXISTS');
      // `OTP_REQUEST_EXISTS` has no translated message yet: only the outcome is asserted in the page.
      await expect(page.getByTestId('toast-notification')).toHaveAttribute('data-variant', 'error');
      await expectEmailStep(page);
    },
  );

  visitorTest(
    'going back from the code step returns to the email step and drops the session',
    async ({ page, mail, redis }) => {
      await requestCode(page, redis, { path: '/signup', email: mail.address('go-back') });
      await signupForm(page).getByRole('button', { name: 'Go Back' }).click();
      await expectEmailStep(page);
      await expect(page).toHaveURL(url => !url.searchParams.has('session'));
    },
  );

  visitorTest('a verification link loaded directly opens the code step', async ({ page, mail }) => {
    // A shared or bookmarked link: the page derives the step from the URL, without a signup request.
    const email = mail.address('direct-link');
    await page.goto(`/signup/verify?email=${encodeURIComponent(email)}&session=pw-unknown-session`);
    await expectCodeStep(page, email);
  });

  visitorTest('an expired verification session keeps the Organization flow', async ({ page, mail, redis }) => {
    const email = mail.address('expired-organization');
    await requestCode(page, redis, { path: '/signup/organization', email });
    await expect(page).toHaveURL(url => url.searchParams.get('organization') === 'true');
    await expireSignupSession(redis, email);
    await enterCode(page, WRONG_CODES[0]);
    await expectErrorToast(page, SESSION_EXPIRED_MESSAGE);
    await expectEmailStep(page);
    await expect(page).toHaveURL(url => url.searchParams.get('organization') === 'true');
  });

  visitorTest(
    'completing the profile leads to the page asked for before signing up',
    async ({ page, mail, recipes, redis }) => {
      const destination = `/home?source=${attemptTag(recipes.attempt)}`;
      await verifyEmail(
        { page, mail, redis },
        { path: `/signup?next=${encodeURIComponent(destination)}`, email: mail.address('next') },
      );
      await expect(page).toHaveURL(
        url => url.pathname === '/signup/profile' && url.searchParams.get('next') === destination,
      );
      await completeProfile(page, `Redirected ${attemptTag(recipes.attempt)}`);
      await expect(page).toHaveURL(url => `${url.pathname}${url.search}` === destination);
    },
  );
});
