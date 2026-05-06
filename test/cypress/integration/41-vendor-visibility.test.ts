/* eslint-disable prefer-arrow-callback */

import { gql } from '@apollo/client';

import type { UseVendorPolicy } from '@/lib/graphql/types/v2/graphql';

import { graphqlQueryV2, signinRequestAndReturnToken } from '../support/commands';

const NEW_VENDOR_NAME = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

function openVendorEditForm(hostSlug: string, hostAdminEmail: string, vendorName: string) {
  cy.login({ email: hostAdminEmail, redirect: `/dashboard/${hostSlug}/vendors` });
  cy.contains(vendorName).click();
  cy.contains('button', 'Edit').click();
}

function assertVendorScopedTo(expectedAccountName: string) {
  cy.get('[data-cy="vendor-form"]').within(() => {
    cy.get('#whereScope-specific').should('have.attr', 'data-state', 'checked');
    cy.contains(expectedAccountName).should('exist');
  });
}

function setUseVendorPolicy(
  hostSlug: string,
  policy: UseVendorPolicy | `${UseVendorPolicy}`,
  userEmail: string,
): Cypress.Chainable<void> {
  return signinRequestAndReturnToken({ email: userEmail }, null).then(token => {
    return graphqlQueryV2(token, {
      operationName: 'SetUseVendorPolicy',
      query: gql`
        mutation SetUseVendorPolicy($account: AccountReferenceInput!, $policies: PoliciesInput!) {
          setPolicies(account: $account, policies: $policies) {
            id
            policies {
              id
              USE_VENDOR_POLICY
            }
          }
        }
      `,
      variables: { account: { slug: hostSlug }, policies: { USE_VENDOR_POLICY: policy } },
    }).then(() => undefined);
  });
}

function setupHostAndCollective(
  opts: {
    policy?: 'HOST_ADMINS' | 'HOST_AND_COLLECTIVE_ADMINS' | 'ALL_SUBMITTERS';
    enableGrants?: boolean;
  } = {},
) {
  return cy.signup().then(hostAdmin => {
    return cy.createHostOrganization(hostAdmin.email).then(host => {
      if (opts.policy) {
        setUseVendorPolicy(host.slug, opts.policy, hostAdmin.email);
      }
      return cy.signup().then(collectiveAdmin => {
        return cy
          .createCollectiveV2({
            email: collectiveAdmin.email,
            skipApproval: true,
            host: { slug: host.slug },
            collective: {
              name: 'Vendor Visibility Collective',
              ...(opts.enableGrants ? { settings: { expenseTypes: { GRANT: true } } } : {}),
            },
          })
          .then(collective => ({ hostAdmin, host, collectiveAdmin, collective }));
      });
    });
  });
}

describe('vendor visibility', () => {
  describe('vendor picker on expense submission', () => {
    it('shows the usable vendor and hides one scoped to a different collective in the same picker', function () {
      setupHostAndCollective().then(({ host, hostAdmin, collective }) => {
        cy.createCollectiveV2({
          email: hostAdmin.email,
          skipApproval: true,
          host: { slug: host.slug },
          collective: { name: 'Other Collective' },
        }).then(otherCollective => {
          const usableName = NEW_VENDOR_NAME('usable-here');
          const nonApplicableName = NEW_VENDOR_NAME('scoped-elsewhere');
          cy.createVendor(
            host.slug,
            { name: usableName, visibleToAccounts: [{ slug: collective.slug }] },
            hostAdmin.email,
          );
          cy.createVendor(
            host.slug,
            { name: nonApplicableName, visibleToAccounts: [{ slug: otherCollective.slug }] },
            hostAdmin.email,
          );

          cy.login({ email: hostAdmin.email, redirect: `/${collective.slug}/expenses/new` });
          cy.get('#WHO_IS_GETTING_PAID').within(() => {
            cy.contains('A vendor').click();
            cy.get('[role="combobox"]').first().click();
          });
          cy.root().closest('html').contains(usableName).should('exist');
          cy.root().closest('html').contains(nonApplicableName).should('not.exist');
        });
      });
    });

    it('shows a vendor that can be used on any hosted collective', function () {
      setupHostAndCollective().then(({ host, hostAdmin }) => {
        cy.createCollectiveV2({
          email: hostAdmin.email,
          skipApproval: true,
          host: { slug: host.slug },
          collective: { name: 'Another Collective' },
        }).then(anotherCollective => {
          const name = NEW_VENDOR_NAME('visible-to-all');
          cy.createVendor(host.slug, { name }, hostAdmin.email).then(() => {
            cy.login({ email: hostAdmin.email, redirect: `/${anotherCollective.slug}/expenses/new` });
            cy.get('#WHO_IS_GETTING_PAID').within(() => {
              cy.contains('A vendor').click();
              cy.get('[role="combobox"]').first().click();
            });
            cy.root().closest('html').contains(name).should('exist');
          });
        });
      });
    });

    it('show host scoped vendor on host expense form, hidden on hosted collective expense', function () {
      setupHostAndCollective().then(({ host, hostAdmin, collective }) => {
        const name = NEW_VENDOR_NAME('host-only');
        cy.createVendor(host.slug, { name, visibleToAccounts: [{ slug: host.slug }] }, hostAdmin.email).then(() => {
          cy.login({ email: hostAdmin.email, redirect: `/${host.slug}/expenses/new` });
          cy.get('#WHO_IS_GETTING_PAID').within(() => {
            cy.contains('A vendor').click();
            cy.get('[role="combobox"]').first().click();
          });
          cy.root().closest('html').contains(name).should('exist');

          cy.login({ email: hostAdmin.email, redirect: `/${collective.slug}/expenses/new` });
          cy.get('#WHO_IS_GETTING_PAID').within(() => {
            cy.contains('A vendor').click();
            cy.get('[role="combobox"]').first().click();
          });
          cy.root().closest('html').contains(name).should('not.exist');
        });
      });
    });

    it('shows a vendor scoped to the parent collective when paying from a child project', function () {
      setupHostAndCollective().then(({ host, hostAdmin, collective, collectiveAdmin }) => {
        cy.createProject({ userEmail: collectiveAdmin.email, collective: { slug: collective.slug } }).then(project => {
          const name = NEW_VENDOR_NAME('parent-scoped');
          cy.createVendor(host.slug, { name, visibleToAccounts: [{ slug: collective.slug }] }, hostAdmin.email).then(
            () => {
              cy.login({ email: hostAdmin.email, redirect: `/${project.slug}/expenses/new` });
              cy.get('#WHO_IS_GETTING_PAID').within(() => {
                cy.contains('A vendor').click();
                cy.get('[role="combobox"]').first().click();
              });
              cy.root().closest('html').contains(name).should('exist');
            },
          );
        });
      });
    });

    it('vendor scope propagates to child account', function () {
      setupHostAndCollective({ policy: 'HOST_AND_COLLECTIVE_ADMINS' }).then(
        ({ host, hostAdmin, collective, collectiveAdmin }) => {
          cy.createProject({ userEmail: collectiveAdmin.email, collective: { slug: collective.slug } }).then(
            project => {
              const parentScoped = NEW_VENDOR_NAME('parent-vendor');
              const childScoped = NEW_VENDOR_NAME('child-vendor');
              cy.createVendor(
                host.slug,
                { name: parentScoped, visibleToAccounts: [{ slug: collective.slug }] },
                hostAdmin.email,
              );
              cy.createVendor(
                host.slug,
                { name: childScoped, visibleToAccounts: [{ slug: project.slug }] },
                hostAdmin.email,
              );

              cy.login({ email: collectiveAdmin.email, redirect: `/${project.slug}/expenses/new` });
              cy.get('#WHO_IS_GETTING_PAID').within(() => {
                cy.contains('A vendor').click();
                cy.get('[role="combobox"]').first().click();
              });
              cy.root().closest('html').contains(parentScoped).should('exist');
              cy.root().closest('html').contains(childScoped).should('exist');
            },
          );
        },
      );
    });

    it('does not show a vendor from a different host', function () {
      setupHostAndCollective().then(({ hostAdmin, collective }) => {
        cy.signup().then(otherHostAdmin => {
          cy.createHostOrganization(otherHostAdmin.email).then(otherHost => {
            const name = NEW_VENDOR_NAME('cross-host');
            cy.createVendor(otherHost.slug, { name }, otherHostAdmin.email).then(() => {
              cy.login({ email: hostAdmin.email, redirect: `/${collective.slug}/expenses/new` });
              cy.get('#WHO_IS_GETTING_PAID').within(() => {
                cy.contains('A vendor').click();
                cy.get('[role="combobox"]').first().click();
              });
              cy.root().closest('html').contains(name).should('not.exist');
            });
          });
        });
      });
    });

    it('does not show a vendor from another host even when the user is admin of both hosts', function () {
      setupHostAndCollective().then(({ hostAdmin, collective }) => {
        cy.createHostOrganization(hostAdmin.email).then(otherHost => {
          const name = NEW_VENDOR_NAME('cross-host-both-admin');
          cy.createVendor(otherHost.slug, { name }, hostAdmin.email).then(() => {
            cy.login({ email: hostAdmin.email, redirect: `/${collective.slug}/expenses/new` });
            cy.get('#WHO_IS_GETTING_PAID').within(() => {
              cy.contains('A vendor').click();
              cy.get('[role="combobox"]').first().click();
            });
            cy.root().closest('html').contains(name).should('not.exist');
          });
        });
      });
    });

    it('does not show a vender from another host', function () {
      setupHostAndCollective({ policy: 'ALL_SUBMITTERS' }).then(({ host, hostAdmin, collective }) => {
        const publicName = NEW_VENDOR_NAME('default-public');
        const hostAdminsOnly = NEW_VENDOR_NAME('host-admins-only');
        const collectiveAdminsOnly = NEW_VENDOR_NAME('collective-admins-only');
        cy.createVendor(host.slug, { name: publicName }, hostAdmin.email);
        cy.createVendor(host.slug, { name: hostAdminsOnly, useVendorPolicy: 'HOST_ADMINS' }, hostAdmin.email);
        cy.createVendor(
          host.slug,
          { name: collectiveAdminsOnly, useVendorPolicy: 'HOST_AND_COLLECTIVE_ADMINS' },
          hostAdmin.email,
        );

        cy.signup().then(otherHostAdmin => {
          cy.createHostOrganization(otherHostAdmin.email).then(otherHost => {
            cy.signup().then(foreignCollectiveAdmin => {
              cy.createCollectiveV2({
                email: foreignCollectiveAdmin.email,
                skipApproval: true,
                host: { slug: otherHost.slug },
                collective: { name: 'Cross-Host Collective' },
              });
              cy.login({ email: foreignCollectiveAdmin.email, redirect: `/${collective.slug}/expenses/new` });
              cy.get('#WHO_IS_GETTING_PAID').within(() => {
                cy.contains('A vendor').click();
                cy.get('[role="combobox"]').first().click();
              });
              cy.root().closest('html').contains(publicName).should('exist');
              cy.root().closest('html').contains(hostAdminsOnly).should('not.exist');
              cy.root().closest('html').contains(collectiveAdminsOnly).should('not.exist');
            });
          });
        });
      });
    });

    it('admin of collective A only sees A-scoped vendors when paying from A', function () {
      setupHostAndCollective({ policy: 'HOST_AND_COLLECTIVE_ADMINS' }).then(
        ({ host, hostAdmin, collective, collectiveAdmin }) => {
          cy.createCollectiveV2({
            email: hostAdmin.email,
            skipApproval: true,
            host: { slug: host.slug },
            collective: { name: 'Other Collective' },
          }).then(otherCollective => {
            const aName = NEW_VENDOR_NAME('a-vendor');
            const bName = NEW_VENDOR_NAME('b-vendor');
            cy.createVendor(
              host.slug,
              { name: aName, visibleToAccounts: [{ slug: collective.slug }] },
              hostAdmin.email,
            );
            cy.createVendor(
              host.slug,
              { name: bName, visibleToAccounts: [{ slug: otherCollective.slug }] },
              hostAdmin.email,
            );

            cy.login({ email: collectiveAdmin.email, redirect: `/${collective.slug}/expenses/new` });
            cy.get('#WHO_IS_GETTING_PAID').within(() => {
              cy.contains('A vendor').click();
              cy.get('[role="combobox"]').first().click();
            });
            cy.root().closest('html').contains(aName).should('exist');
            cy.root().closest('html').contains(bName).should('not.exist');
          });
        },
      );
    });

    it('vendor HOST_ADMINS policy override host ALL_SUBMITTERS policy', function () {
      setupHostAndCollective({ policy: 'ALL_SUBMITTERS' }).then(({ host, hostAdmin, collective, collectiveAdmin }) => {
        const restrictedName = NEW_VENDOR_NAME('host-admins-override');
        const visibleName = NEW_VENDOR_NAME('public');
        cy.createVendor(host.slug, { name: restrictedName, useVendorPolicy: 'HOST_ADMINS' }, hostAdmin.email);
        cy.createVendor(host.slug, { name: visibleName }, hostAdmin.email);

        cy.login({ email: collectiveAdmin.email, redirect: `/${collective.slug}/expenses/new` });
        cy.get('#WHO_IS_GETTING_PAID').within(() => {
          cy.contains('A vendor').click();
          cy.get('[role="combobox"]').first().click();
        });
        cy.root().closest('html').contains(visibleName).should('exist');
        cy.root().closest('html').contains(restrictedName).should('not.exist');
      });
    });

    it('vendor ALL_SUBMITTERS policy override host HOST_ADMINS policy', function () {
      setupHostAndCollective({ policy: 'HOST_ADMINS' }).then(({ host, hostAdmin, collective, collectiveAdmin }) => {
        const overrideName = NEW_VENDOR_NAME('public-override');
        const restrictedName = NEW_VENDOR_NAME('default-restricted');
        cy.createVendor(
          host.slug,
          {
            name: overrideName,
            useVendorPolicy: 'ALL_SUBMITTERS',
            visibleToAccounts: [{ slug: collective.slug }],
          },
          hostAdmin.email,
        );
        cy.createVendor(
          host.slug,
          { name: restrictedName, visibleToAccounts: [{ slug: collective.slug }] },
          hostAdmin.email,
        );

        cy.login({ email: collectiveAdmin.email, redirect: `/${collective.slug}/expenses/new` });
        cy.get('#WHO_IS_GETTING_PAID').within(() => {
          cy.contains('A vendor').click();
          cy.get('[role="combobox"]').first().click();
        });
        cy.root().closest('html').contains(overrideName).should('exist');
        cy.root().closest('html').contains(restrictedName).should('not.exist');
      });
    });

    it('host ALL_SUBMITTERS policy is overriden by more strict vendor policy', function () {
      setupHostAndCollective({ policy: 'ALL_SUBMITTERS' }).then(({ host, hostAdmin, collective }) => {
        const publicName = NEW_VENDOR_NAME('default-public');
        const hostAdminsOnly = NEW_VENDOR_NAME('host-admins-only');
        const collectiveAdminsOnly = NEW_VENDOR_NAME('collective-admins-only');
        cy.createVendor(host.slug, { name: publicName }, hostAdmin.email);
        cy.createVendor(host.slug, { name: hostAdminsOnly, useVendorPolicy: 'HOST_ADMINS' }, hostAdmin.email);
        cy.createVendor(
          host.slug,
          { name: collectiveAdminsOnly, useVendorPolicy: 'HOST_AND_COLLECTIVE_ADMINS' },
          hostAdmin.email,
        );

        cy.signup().then(randomUser => {
          cy.login({ email: randomUser.email, redirect: `/${collective.slug}/expenses/new` });
          cy.get('#WHO_IS_GETTING_PAID').within(() => {
            cy.contains('A vendor').click();
            cy.get('[role="combobox"]').first().click();
          });
          cy.root().closest('html').contains(publicName).should('exist');
          cy.root().closest('html').contains(hostAdminsOnly).should('not.exist');
          cy.root().closest('html').contains(collectiveAdminsOnly).should('not.exist');
        });
      });
    });
  });

  describe('vendor picker on grant submission', () => {
    it('grant beneficiary picker shows a vendor scoped to the paying collective', function () {
      setupHostAndCollective({ enableGrants: true }).then(({ host, hostAdmin, collective }) => {
        const name = NEW_VENDOR_NAME('grant-scoped-here');
        cy.createVendor(host.slug, { name, visibleToAccounts: [{ slug: collective.slug }] }, hostAdmin.email);
        cy.login({ email: hostAdmin.email, redirect: `/${collective.slug}/grants/new` });
        cy.contains('button', 'Proceed').click();
        cy.get('#WHO_WILL_RECEIVE_FUNDS').within(() => {
          cy.contains('A beneficiary').click();
          cy.get('[role="combobox"]').first().click();
        });
        cy.root().closest('html').contains(name).should('exist');
      });
    });

    it('collective admin of paying account can submit a grant to a scoped beneficiary', function () {
      setupHostAndCollective({ enableGrants: true, policy: 'HOST_AND_COLLECTIVE_ADMINS' }).then(
        ({ host, hostAdmin, collective, collectiveAdmin }) => {
          const name = NEW_VENDOR_NAME('grant-submit');
          cy.createVendor(
            host.slug,
            {
              name,
              visibleToAccounts: [{ slug: collective.slug }],
              payoutMethod: { type: 'OTHER', name: 'Bank', data: { content: 'Bank details', currency: 'USD' } },
            },
            hostAdmin.email,
          );
          cy.login({ email: collectiveAdmin.email, redirect: `/${collective.slug}/grants/new` });
          cy.contains('button', 'Proceed').click();
          cy.get('#WHO_WILL_RECEIVE_FUNDS').within(() => {
            cy.contains('A beneficiary').click();
          });
          cy.get('#__vendor').type(name);
          cy.root().closest('html').contains('[role="option"]', name).click();
          cy.get('[name="title"]').type('Grant submit visibility test');
          cy.get('[name="expenseItems.0.description"]').type('Grant test item');
          cy.get('[name="expenseItems.0.amount.valueInCents"]').type('{selectall}1000');
          cy.contains('button', 'Proceed to Summary').click();
          cy.contains('button', 'Submit Grant Request').click();
          cy.contains('Grant #').should('be.visible');
        },
      );
    });
  });

  describe('Add Funds source picker', () => {
    it('shows the usable vendor and hides one scoped to a different collective in the source dropdown', function () {
      setupHostAndCollective().then(({ host, hostAdmin, collective }) => {
        cy.createCollectiveV2({
          email: hostAdmin.email,
          skipApproval: true,
          host: { slug: host.slug },
          collective: { name: 'Add Funds Other Collective' },
        }).then(otherCollective => {
          const usableName = NEW_VENDOR_NAME('add-funds-usable');
          const elsewhereName = NEW_VENDOR_NAME('add-funds-elsewhere');
          cy.createVendor(
            host.slug,
            { name: usableName, visibleToAccounts: [{ slug: collective.slug }] },
            hostAdmin.email,
          );
          cy.createVendor(
            host.slug,
            { name: elsewhereName, visibleToAccounts: [{ slug: otherCollective.slug }] },
            hostAdmin.email,
          );

          cy.login({ email: hostAdmin.email, redirect: `/dashboard/${host.slug}/hosted-collectives` });
          cy.getByDataCy(`collective-${collective.slug}`).within(() => {
            cy.getByDataCy('more-actions-btn').click();
          });
          cy.getByDataCy('actions-add-funds').click();
          cy.get('#addFunds-fromAccount').click();
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(150);
          cy.get('#addFunds-fromAccount').type(usableName, { delay: 50 });
          cy.root().closest('html').contains(usableName).should('exist');
          cy.root().closest('html').contains(elsewhereName).should('not.exist');
        });
      });
    });
  });

  describe('inline vendor creation defaults', () => {
    it('Add Funds modal: created vendor is scoped to the paying collective', function () {
      setupHostAndCollective().then(({ host, hostAdmin, collective }) => {
        cy.login({ email: hostAdmin.email, redirect: `/dashboard/${host.slug}/hosted-collectives` });

        cy.getByDataCy(`collective-${collective.slug}`).within(() => {
          cy.getByDataCy('more-actions-btn').click();
        });
        cy.getByDataCy('actions-add-funds').click();

        const name = NEW_VENDOR_NAME('addfunds');
        cy.get('#addFunds-fromAccount').click();
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(150);
        cy.get('#addFunds-fromAccount').type(name, { delay: 50 });
        cy.contains(`Create vendor: ${name}`).click();

        openVendorEditForm(host.slug, hostAdmin.email, name);
        assertVendorScopedTo(collective.name);
      });
    });

    it('Expense flow: inline-created vendor is scoped to the paying collective', function () {
      setupHostAndCollective().then(({ host, hostAdmin, collective }) => {
        cy.login({ email: hostAdmin.email, redirect: `/${collective.slug}/expenses/new` });
        cy.get('#WHO_IS_GETTING_PAID').within(() => {
          cy.contains('A vendor').click();
          cy.get('[role="combobox"]').first().click();
        });
        cy.root().closest('html').contains('Create Vendor').click();

        const name = NEW_VENDOR_NAME('expense-inline');
        cy.contains('label', "Vendor's name").click();
        cy.focused().type(name);
        cy.contains('button', 'Create vendor').click();

        openVendorEditForm(host.slug, hostAdmin.email, name);
        assertVendorScopedTo(collective.name);
      });
    });

    it('Pending contribution modal: inline-created vendor is scoped to the receiving collective', function () {
      setupHostAndCollective().then(({ host, hostAdmin, collective }) => {
        cy.login({ email: hostAdmin.email, redirect: `/dashboard/${host.slug}/expected-funds` });
        cy.getByDataCy('create-pending-contribution').click();
        cy.getByDataCy('create-pending-contribution-to').type(collective.name);
        cy.root().closest('html').contains('[role="option"]', collective.name).click();

        const name = NEW_VENDOR_NAME('pending-inline');
        cy.getByDataCy('create-pending-contribution-source').type(name);
        // Default mini-form path: pick the "Vendor" type then submit.
        cy.root()
          .closest('html')
          .contains(/Create new/i)
          .click();
        cy.root()
          .closest('html')
          .contains('button', /Vendor/i)
          .click();
        cy.contains('label', /Display name/i).click();
        cy.focused().clear().type(name);
        cy.contains('button', /Create vendor/i).click();

        openVendorEditForm(host.slug, hostAdmin.email, name);
        assertVendorScopedTo(collective.name);
      });
    });

    it('Grant flow: inline-created beneficiary is scoped to the paying collective and visibility section is hidden', function () {
      setupHostAndCollective({ enableGrants: true }).then(({ host, hostAdmin, collective }) => {
        cy.login({ email: hostAdmin.email, redirect: `/${collective.slug}/grants/new` });
        cy.contains('button', 'Proceed').click();
        cy.get('#WHO_WILL_RECEIVE_FUNDS').within(() => {
          cy.contains('A beneficiary').click();
          cy.get('[role="combobox"]').first().click();
        });
        cy.root().closest('html').contains('Create Beneficiary').click();

        cy.get('#WHO_WILL_RECEIVE_FUNDS').within(() => {
          cy.contains('Visible to all collectives and funds').should('not.exist');
        });

        const name = NEW_VENDOR_NAME('grant-inline');
        cy.contains('label', "Beneficiary's name").click();
        cy.focused().type(name);
        cy.contains('button', 'Create beneficiary').click();

        openVendorEditForm(host.slug, hostAdmin.email, name);
        assertVendorScopedTo(collective.name);
      });
    });
  });

  describe('vendor settings dashboard', () => {
    it('edits a vendor policy', function () {
      // Pre-create a vendor + a collective the form can scope it to.
      setupHostAndCollective().then(({ host, hostAdmin, collective }) => {
        const name = NEW_VENDOR_NAME('settings-roundtrip');
        cy.createVendor(host.slug, { name }, hostAdmin.email).then(() => {
          cy.login({ email: hostAdmin.email, redirect: `/dashboard/${host.slug}/vendors` });

          cy.contains(name).click();
          cy.contains('button', 'Edit').click();

          cy.contains('In relation to the following selected accounts').click();
          cy.get('#visibleToAccountsInput').type(collective.name);
          cy.root().closest('html').contains('[role="option"]', collective.name).click();

          cy.contains('All expense submitters').click();

          cy.contains('button', /Update vendor/i).click();
          cy.contains(/Vendor Updated|Vendor updated/i, { timeout: 15000 }).should('be.visible');

          openVendorEditForm(host.slug, hostAdmin.email, name);
          assertVendorScopedTo(collective.name);
          cy.get('#useVendorPolicy-ALL_SUBMITTERS').should('have.attr', 'data-state', 'checked');
        });
      });
    });

    it('created vendor defaults to host policy', function () {
      setupHostAndCollective({ policy: 'HOST_AND_COLLECTIVE_ADMINS' }).then(({ host, hostAdmin }) => {
        const name = NEW_VENDOR_NAME('inherit-default');
        cy.createVendor(host.slug, { name }, hostAdmin.email).then(() => {
          openVendorEditForm(host.slug, hostAdmin.email, name);
          cy.get('#useVendorPolicy-inherit').should('have.attr', 'data-state', 'checked');
          cy.contains(/Host default \(.*admins and collective admins\)/i).should('exist');
        });
      });
    });

    it('updated host policy applies to vendors that use the host default', function () {
      setupHostAndCollective({ policy: 'HOST_ADMINS' }).then(({ host, hostAdmin }) => {
        const name = NEW_VENDOR_NAME('inherit-follows-host');
        cy.createVendor(host.slug, { name }, hostAdmin.email).then(() => {
          openVendorEditForm(host.slug, hostAdmin.email, name);
          cy.get('#useVendorPolicy-inherit').should('have.attr', 'data-state', 'checked');
          cy.contains(/Host default \(Only.*admins\)/i).should('exist');

          setUseVendorPolicy(host.slug, 'ALL_SUBMITTERS', hostAdmin.email);
          openVendorEditForm(host.slug, hostAdmin.email, name);
          cy.get('#useVendorPolicy-inherit').should('have.attr', 'data-state', 'checked');
          cy.contains(/Host default \(All expense submitters\)/i).should('exist');
        });
      });
    });
  });
});
