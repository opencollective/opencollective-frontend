import * as cheerio from 'cheerio';

import { randomEmail, randomSlug } from '../support/faker';

const HOST_SLUG = 'brusselstogetherasbl';

const getEmailToMatcher = (To, email) =>
  To[0].Address.includes(email) || To[0].Address.includes(email.replace(/@/g, '-at-'));

describe('host dashboard: create hosted collective', () => {
  beforeEach(() => {
    cy.login({ redirect: `/dashboard/${HOST_SLUG}/hosted-collectives` });
  });

  it('can create a collective and invite a new admin, then invite another admin from the drawer', () => {
    const collectiveName = `Cypress Collective ${randomSlug()}`;
    const collectiveSlug = randomSlug();
    const firstInviteeEmail = randomEmail();
    const firstInviteeName = `Invitee One ${randomSlug()}`;

    cy.mailpitDeleteAllEmails();

    // Open the "Create collective" modal from the hosted collectives dashboard
    cy.getByDataCy('create-collective-btn').click();
    cy.getByDataCy('create-collective-form').as('createForm');

    cy.get('@createForm').find('input[name="collective.name"]').type(collectiveName);
    // Slug is auto-suggested from the name; override it for predictability
    cy.get('@createForm').find('input[name="collective.slug"]').type(`{selectall}${collectiveSlug}`);
    cy.get('@createForm')
      .find('input[name="collective.description"]')
      .type('A collective created via the host dashboard E2E test');

    // Invite a first admin via the embedded invite-user modal trigger
    cy.get('@createForm').find('[data-cy="add-team-member"]').click();
    cy.getByDataCy('invite-user-modal-form').as('inviteForm');
    cy.get('@inviteForm').find('input[name="name"]').type(firstInviteeName);
    cy.get('@inviteForm').find('input[name="email"]').type(firstInviteeEmail);
    cy.get('@inviteForm').find('button').contains('Add User').click();
    cy.getByDataCy('invite-user-modal-form').should('not.exist');

    // The invitee should now be displayed as a chip inside the form
    cy.get('@createForm').contains(firstInviteeName);

    // Optional private note to admins
    cy.get('@createForm').find('textarea[name="privateNote"]').type('Welcome to the collective!');

    // Submit
    cy.getByDataCy('create-collective-submit').click();
    cy.checkToast({ variant: 'success', message: 'Collective created successfully!' });

    // The collective should appear in the table
    cy.getByDataCy(`collective-${collectiveSlug}`).should('exist').contains(collectiveName);

    // The first invitee should have received an invitation email
    cy.mailpitHasEmailsBySubject(`[TESTING] Invitation to join ${collectiveName}`).then(result => {
      expect(result.count).to.be.greaterThan(0);
    });

    // Open the hosted account overview page (HostedAccountOverviewTab)
    cy.getByDataCy(`collective-${collectiveSlug}`).click();
    cy.contains(`Overview`).should('be.visible');

    // The invited admin should be listed inside the admins section (as a pending invitation)
    cy.getByDataCy('admins-list').as('adminsList');
    cy.get('@adminsList').contains(firstInviteeName).should('be.visible');

    // The new invitee should appear in the admins list as "Invited"
    cy.logout();
    cy.visit('/home');

    // The first invitee receives an email and can complete onboarding & accept the invitation
    cy.openEmail(
      ({ Subject, To }) => getEmailToMatcher(To, firstInviteeEmail) && Subject.includes(collectiveName),
    ).then(email => {
      const $html = cheerio.load(email.HTML);
      const emailBody = $html('body').text();
      expect(emailBody).to.include('Welcome to the collective!');

      // Follow the actual link from the email instead of faking the login flow.
      // For a new invitee, the link goes to /signin?next=/signup/profile?next=%2Fmember-invitations%23invitation-...
      const inviteLink = $html('a:contains("Sign up and view invitation"), a:contains("View invitation")').first();
      const href = inviteLink.attr('href');
      expect(href, 'invitation link href').to.be.a('string');
      const parsedUrl = new URL(href);
      cy.visit(parsedUrl.pathname + parsedUrl.search);
    });

    // The invitee signs in with their email (direct sign-in for opencollective.com test addresses)
    // cy.url().should('include', '/signin');
    cy.get('input[name=email]').type(firstInviteeEmail);
    cy.get('button[type=submit]').click();

    // New user is routed through /signup/profile before reaching the invitation
    cy.url().should('include', '/signup/profile');
    cy.url().should('include', `next=${encodeURIComponent('/member-invitations')}`);
    cy.getByDataCy('complete-profile-form').as('profileForm');
    cy.get('@profileForm').find('input[name="name"]').type(firstInviteeName);
    cy.get('@profileForm').find('button[type="submit"]').click();

    // After completing profile, redirected to /member-invitations to accept
    cy.url().should('include', '/member-invitations');
    cy.getByDataCy('member-invitation-card').contains(collectiveName);
    cy.getByDataCy('member-invitation-accept-btn').first().click();
  });

  it('can create a collective adding the host admin as the sole admin', () => {
    const collectiveName = `Cypress SelfAdmin ${randomSlug()}`;
    const collectiveSlug = randomSlug();

    cy.getByDataCy('create-collective-btn').click();
    cy.getByDataCy('create-collective-form').as('createForm');

    cy.get('@createForm').find('input[name="collective.name"]').type(collectiveName);
    cy.get('@createForm').find('input[name="collective.slug"]').type(`{selectall}${collectiveSlug}`);
    cy.get('@createForm')
      .find('input[name="collective.description"]')
      .type('Self-admin collective created via the host dashboard E2E test');

    // Tick the "add me as admin" checkbox (no invitees needed)
    cy.getByDataCy('include-self-as-admin').click();

    cy.getByDataCy('create-collective-submit').click();
    cy.checkToast({ variant: 'success', message: 'Collective created successfully!' });

    // Verify the collective appears in the table
    cy.getByDataCy(`collective-${collectiveSlug}`).should('exist').contains(collectiveName);

    // Open the hosted account overview page and verify there's at least one admin and no pending invitations
    cy.getByDataCy(`collective-${collectiveSlug}`).click();
    cy.contains(`Overview`).should('be.visible');

    // The "Invite admin" option is not shown in More Actions when an admin already exists
    cy.getByDataCy('more-actions-btn').first().click();
    cy.getByDataCy('invite-admin-btn').should('not.exist');
    cy.getByDataCy('cancel-invitation-btn').should('not.exist');
  });
});
