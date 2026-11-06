/**
 * Core-flow inventory of the two pilots: each test of the original Cypress
 * files with the Playwright journeys that carry it. Checked against the
 * sources by `node test/playwright/evaluation/cli.ts inventory`.
 */
import type { InventoryEntry } from './inventory.ts';

const EXPENSES = '27-expenses.test.ts';
const VENDORS = '41-vendor-visibility.test.ts';

const entry = (
  group: string,
  file: string,
  cypressTitle: string,
  journeys: Array<[string, string]>,
  extra: Pick<InventoryEntry, 'note' | 'gap'> = {},
): InventoryEntry => ({
  group,
  cypress: { file, title: cypressTitle },
  journeys: journeys.map(([journeyFile, title]) => ({ file: journeyFile, title })),
  ...extra,
});

const bothTypes = (
  group: string,
  cypressTitle: (type: string) => string,
  journeys: (type: 'invoice' | 'reimbursement') => Array<[string, string]>,
) => (['invoice', 'reimbursement'] as const).map(type => entry(group, EXPENSES, cypressTitle(type), journeys(type)));

const SUBMISSION = 'Expense submission';
const INVITATION = 'Expense invitation';
const MANAGEMENT = 'Expense management';
const PICKER = 'Vendor picker';
const CREATION = 'Vendor creation and settings';

const a = (type: 'invoice' | 'reimbursement') => (type === 'invoice' ? 'an invoice' : 'a reimbursement');

export const pilotInventory: InventoryEntry[] = [
  // 27-expenses.test.ts
  entry(SUBMISSION, EXPENSES, 'shows the login screen', [
    ['expenses/logged-out.spec.ts', 'logged-out visitor is asked to sign in before submitting an expense'],
  ]),
  entry(SUBMISSION, EXPENSES, 'shows Submit Expense button on collective page and redirects to login', [
    [
      'expenses/logged-out.spec.ts',
      'logged-out visitor reaches sign-in from the Submit Expense button of a Collective',
    ],
  ]),
  entry(MANAGEMENT, EXPENSES, 'Downloads PDF', [
    ['expenses/process-expense.spec.ts', 'Collective admin downloads the generated invoice of an expense as a PDF'],
  ]),
  entry(MANAGEMENT, EXPENSES, 'Previews a PDF attachment', [], {
    gap: 'Added to Cypress on 2026-10-13 (opencollective/opencollective-frontend#12558, pdf.js worker regression) before the pilot merged; no journey carries it.',
  }),
  entry(MANAGEMENT, EXPENSES, 'Approve, unapprove, reject and pay actions on expense', [
    [
      'expenses/process-expense.spec.ts',
      'Collective admin approves, unapproves and rejects an expense, leaving a comment for each reversal',
    ],
  ]),
  entry(MANAGEMENT, EXPENSES, 'Delete expense', [
    [
      'expenses/process-expense.spec.ts',
      'Collective admin deletes a rejected expense, which is then no longer available',
    ],
  ]),
  entry(MANAGEMENT, EXPENSES, 'Displays expense policy', [
    [
      'expenses/expense-policy.spec.ts',
      'Collective admin writes expense policies in the dashboard and submitters see them on the expense form',
    ],
  ]),
  entry(MANAGEMENT, EXPENSES, 'Projects inherit and display expense policy from parent collective', [
    [
      'expenses/expense-policy.spec.ts',
      'Collective with a Project › expense form of a Project shows the expense policy of its parent Collective',
    ],
  ]),
  entry(
    SUBMISSION,
    EXPENSES,
    'User without administered accounts can create a legal entity and submit an invoice expense',
    [
      [
        'expenses/submit-invoice-variants.spec.ts',
        'user without administered accounts creates a legal entity and submits an invoice through it',
      ],
    ],
  ),
  entry(SUBMISSION, EXPENSES, 'User can submit invoice expense with taxes', [
    [
      'expenses/submit-invoice-variants.spec.ts',
      'paying Collective subject to VAT › user submits an invoice with value-added tax',
    ],
  ]),
  entry(SUBMISSION, EXPENSES, 'keeps the expense in USD when the selected payout method is in EUR', [
    [
      'expenses/draft-currency.spec.ts',
      'invited Organization submits a USD draft with a EUR payout method and the expense stays in USD',
    ],
  ]),
  ...bothTypes(
    SUBMISSION,
    type => `New user can submit ${type} expense to collective hosted by e2e-host`,
    type => [
      [
        'expenses/submit-first-expense.spec.ts',
        `new user submits a first ${type} to a Collective they do not administer`,
      ],
    ],
  ),
  ...bothTypes(
    SUBMISSION,
    type => `User can submit ${type} expense to previously submitted collective`,
    type => [
      [
        'expenses/submit-returning-expense.spec.ts',
        `returning submitter requests ${type} payment for their Organization, then invites another payee`,
      ],
    ],
  ),
  ...bothTypes(
    INVITATION,
    type => `User can submit ${type} expense invite to existing organization`,
    type => [
      [
        'expenses/invite-organization.spec.ts',
        `invited Organization follows its emailed ${type} invitation and submits the expense`,
      ],
    ],
  ),
  ...bothTypes(
    INVITATION,
    type => `User can submit ${type} expense invite to existing organization initially logged out`,
    type => [
      [
        'expenses/invite-organization-logged-out.spec.ts',
        `logged-out admin of an invited Organization signs in from its emailed ${type} invitation and submits the expense`,
      ],
    ],
  ),
  ...bothTypes(
    INVITATION,
    type => `User can submit ${type} expense invite to new user`,
    type => [
      [
        'expenses/invite-new-user.spec.ts',
        `person without an account follows their emailed ${type} invitation and submits the expense without signing in`,
      ],
    ],
  ),
  ...bothTypes(
    MANAGEMENT,
    type => `User can setup recurring ${type} expense`,
    type => [['expenses/recurring-expense.spec.ts', `user submits ${a(type)} set to recur every month`]],
  ),
  ...bothTypes(
    MANAGEMENT,
    type => `Duplicates an ${type} expense`,
    type => [
      [
        'expenses/duplicate-expense.spec.ts',
        `user duplicates an expense they submitted and sends the copy as ${a(type)}`,
      ],
    ],
  ),
  // `Edits title` and `Edits items` come from one `commonEditScenario` called for both types.
  entry(MANAGEMENT, EXPENSES, 'Edits title', [
    ['expenses/edit-expense.spec.ts', 'pending invoice › submitter renames it'],
    ['expenses/edit-expense.spec.ts', 'pending reimbursement › submitter renames it'],
  ]),
  entry(MANAGEMENT, EXPENSES, 'Edits items', [
    [
      'expenses/edit-expense.spec.ts',
      'pending invoice › submitter edits its items and switches its reference currency',
    ],
    [
      'expenses/edit-expense.spec.ts',
      'pending reimbursement › submitter edits its items and switches its reference currency',
    ],
  ]),

  // 41-vendor-visibility.test.ts
  entry(
    PICKER,
    VENDORS,
    'non-admin: shows the usable vendor and hides one scoped to a different collective in the same picker',
    [
      [
        'vendors/vendor-scope.spec.ts',
        'vendors scoped to different Collectives of one host › Collective admin is offered the vendor scoped to their Collective and not the one scoped to another',
      ],
    ],
  ),
  entry(
    PICKER,
    VENDORS,
    'admin of collective A only sees A-scoped vendors when paying from A',
    [
      [
        'vendors/vendor-scope.spec.ts',
        'vendors scoped to different Collectives of one host › Collective admin is offered the vendor scoped to their Collective and not the one scoped to another',
      ],
    ],
    { note: 'Consolidated: builds the same graph and asserts the same names as the previous Cypress test.' },
  ),
  entry(PICKER, VENDORS, 'shows a vendor that can be used on any hosted collective', [
    [
      'vendors/vendor-scope.spec.ts',
      'vendor usable with every Account of the host › host admin is offered an unscoped vendor when paying from any hosted Collective',
    ],
  ]),
  entry(PICKER, VENDORS, 'non-admin: host-scoped vendor is hidden on a hosted collective expense form', [
    [
      'vendors/vendor-scope.spec.ts',
      'vendor scoped to the host itself › Collective admin is not offered a host-scoped vendor when paying from their Collective',
    ],
  ]),
  entry(PICKER, VENDORS, 'host admin: sees host-scoped vendor on every expense form', [
    [
      'vendors/vendor-scope.spec.ts',
      'vendor scoped to the host itself › as the host admin › host admin is offered a host-scoped vendor when paying from the host and from a hosted Collective',
    ],
  ]),
  entry(PICKER, VENDORS, 'shows a vendor scoped to the parent collective when paying from a child project', [
    [
      'vendors/vendor-project-scope.spec.ts',
      'host admin paying from a Project is offered a vendor scoped to its parent Collective',
    ],
  ]),
  entry(PICKER, VENDORS, 'vendor scope propagates to child account', [
    [
      'vendors/vendor-project-scope.spec.ts',
      'as the admin of the parent Collective › Collective admin paying from a Project is offered vendors scoped to the Project and to its parent',
    ],
  ]),
  entry(PICKER, VENDORS, 'does not show a vendor from a different host', [
    ['vendors/vendor-foreign-host.spec.ts', 'host admin is not offered a vendor of another host'],
  ]),
  entry(PICKER, VENDORS, 'does not show a vendor from another host even when the user is admin of both hosts', [
    [
      'vendors/vendor-foreign-host.spec.ts',
      'admin of both hosts › admin of two hosts is not offered a vendor of the host that does not hold the paying Collective',
    ],
  ]),
  entry(PICKER, VENDORS, 'does not show a vender from another host', [
    [
      'vendors/vendor-policy.spec.ts',
      'admin of a Collective on another host › admin of a Collective on another host is only offered vendors that follow a host open to all submitters',
    ],
  ]),
  entry(PICKER, VENDORS, 'vendor HOST_ADMINS policy override host ALL_SUBMITTERS policy', [
    [
      'vendors/vendor-policy.spec.ts',
      'host open to all submitters › Collective admin is not offered a vendor restricted to host admins on a host open to all submitters',
    ],
  ]),
  entry(PICKER, VENDORS, 'vendor ALL_SUBMITTERS policy override host HOST_ADMINS policy', [
    [
      'vendors/vendor-policy.spec.ts',
      'host restricted to host admins › Collective admin is offered a vendor open to all submitters on a host restricted to host admins',
    ],
  ]),
  entry(PICKER, VENDORS, 'host ALL_SUBMITTERS policy is overriden by more strict vendor policy', [
    [
      'vendors/vendor-policy.spec.ts',
      'submitter with no role on the host › submitter without any role is only offered vendors that follow a host open to all submitters',
    ],
  ]),
  entry(PICKER, VENDORS, 'grant beneficiary picker shows a vendor scoped to the paying collective', [
    [
      'vendors/grant-beneficiary.spec.ts',
      'host admin is offered a beneficiary scoped to the Collective granting the funds',
    ],
  ]),
  entry(PICKER, VENDORS, 'collective admin of paying account can submit a grant to a scoped beneficiary', [
    [
      'vendors/grant-beneficiary.spec.ts',
      'as the admin of the granting Collective › Collective admin submits a grant request to a beneficiary scoped to their Collective',
    ],
  ]),
  entry(
    PICKER,
    VENDORS,
    'shows the usable vendor and hides one scoped to a different collective in the source dropdown',
    [
      [
        'vendors/add-funds-source.spec.ts',
        'host admin adding funds to a Collective finds the vendor scoped to it as the source',
      ],
    ],
    {
      note: 'Partial: carries the "shows" half; the "hides" half cannot fail in the source for the host admins who use that dialog.',
    },
  ),
  entry(CREATION, VENDORS, 'Add Funds modal: created vendor is scoped to the paying collective', [
    [
      'vendors/vendor-creation.spec.ts',
      'vendor created while adding funds to a Collective is scoped to that Collective',
    ],
  ]),
  entry(CREATION, VENDORS, 'Expense flow: inline-created vendor is scoped to the paying collective', [
    ['vendors/vendor-creation.spec.ts', 'vendor created from the expense form is scoped to the paying Collective'],
  ]),
  entry(CREATION, VENDORS, 'Pending contribution modal: inline-created vendor is scoped to the receiving collective', [
    [
      'vendors/vendor-creation.spec.ts',
      'vendor created while recording expected funds is scoped to the receiving Collective',
    ],
  ]),
  entry(CREATION, VENDORS, 'Grant flow: inline-created beneficiary is scoped to the paying collective', [
    [
      'vendors/vendor-creation.spec.ts',
      'Collective that makes grants › beneficiary created from the grant form is scoped to the granting Collective',
    ],
  ]),
  entry(CREATION, VENDORS, 'edits a vendor policy', [
    [
      'vendors/vendor-settings.spec.ts',
      'host with two vendors only its admins can use › host admin limits a vendor to one Collective and opens it to all submitters',
    ],
  ]),
  entry(CREATION, VENDORS, 'created vendor defaults to host policy', [
    [
      'vendors/vendor-settings.spec.ts',
      'host open to its admins and Collective admins › vendor created on the vendors dashboard follows the policy of its host',
    ],
  ]),
  entry(CREATION, VENDORS, 'updated host policy applies to vendors that use the host default', [
    [
      'vendors/vendor-settings.spec.ts',
      'host restricted to its admins › vendors that follow their host take up a vendor policy changed in the host settings',
    ],
  ]),
];
