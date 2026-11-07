import { checkInventory, extractCypressTests, listPlaywrightTests } from './inventory';

const cypressSource = `
describe('Expense flow', () => {
  it('shows the login screen', () => {});
  it(\`User can submit \${expenseType} expense invite to new user\`, function () {});
  it.skip("Previews a PDF attachment", () => {});
});
`;

describe('extractCypressTests', () => {
  it('reads every it() title, keeping template placeholders as wildcards', () => {
    const tests = extractCypressTests('27-expenses.test.ts', cypressSource);
    expect(tests.map(t => t.title)).toEqual([
      'shows the login screen',
      'User can submit ${expenseType} expense invite to new user',
      'Previews a PDF attachment',
    ]);
    expect(tests[1].matches('User can submit reimbursement expense invite to new user')).toBe(true);
    expect(tests[1].matches('User can submit expense invite to new user')).toBe(false);
    expect(tests[0].matches('shows the login screen and more')).toBe(false);
  });
});

describe('listPlaywrightTests', () => {
  it('flattens a `playwright test --list --reporter=json` report into file and full title', () => {
    const report = {
      suites: [
        {
          title: 'vendors/vendor-policy.spec.ts',
          file: 'vendors/vendor-policy.spec.ts',
          specs: [{ title: 'top level' }],
          suites: [{ title: 'host restricted', specs: [{ title: 'inner' }], suites: [] }],
        },
      ],
    };
    expect(listPlaywrightTests(report)).toEqual([
      { file: 'vendors/vendor-policy.spec.ts', title: 'top level' },
      { file: 'vendors/vendor-policy.spec.ts', title: 'host restricted › inner' },
    ]);
  });
});

describe('checkInventory', () => {
  const cypress = extractCypressTests('27-expenses.test.ts', cypressSource);
  const playwright = [
    { file: 'expenses/logged-out.spec.ts', title: 'asked to sign in' },
    { file: 'expenses/invite-new-user.spec.ts', title: 'invoice' },
    { file: 'expenses/invite-new-user.spec.ts', title: 'reimbursement' },
    { file: 'smoke.spec.ts', title: 'not a pilot journey' },
  ];
  const complete = [
    {
      group: 'Expense submission',
      cypress: { file: '27-expenses.test.ts', title: 'shows the login screen' },
      journeys: [{ file: 'expenses/logged-out.spec.ts', title: 'asked to sign in' }],
    },
    {
      group: 'Expense invitation',
      cypress: { file: '27-expenses.test.ts', title: 'User can submit invoice expense invite to new user' },
      journeys: [{ file: 'expenses/invite-new-user.spec.ts', title: 'invoice' }],
    },
    {
      group: 'Expense invitation',
      cypress: { file: '27-expenses.test.ts', title: 'User can submit reimbursement expense invite to new user' },
      journeys: [{ file: 'expenses/invite-new-user.spec.ts', title: 'reimbursement' }],
    },
  ];
  const pilotFiles = (file: string) => file.startsWith('expenses/');

  it('reports a Cypress test that no inventory entry accounts for', () => {
    const result = checkInventory({ cypress, playwright, entries: complete, isPilotJourney: pilotFiles });
    expect(result.unmappedCypress.map(t => t.title)).toEqual(['Previews a PDF attachment']);
    expect(result.complete).toBe(false);
  });

  it('is complete once every test is mapped, and an explicit gap still counts as not covered', () => {
    const withGap = [
      ...complete,
      {
        group: 'Expense management',
        cypress: { file: '27-expenses.test.ts', title: 'Previews a PDF attachment' },
        journeys: [],
        gap: 'no journey yet',
      },
    ];
    const result = checkInventory({ cypress, playwright, entries: withGap, isPilotJourney: pilotFiles });
    expect(result.unmappedCypress).toEqual([]);
    expect(result.gaps.map(e => e.cypress.title)).toEqual(['Previews a PDF attachment']);
    expect(result.complete).toBe(true);
    expect(result.coversAllCoreFlows).toBe(false);
  });

  it('reports stale entries: a Cypress title or journey that no longer exists', () => {
    const stale = [
      ...complete,
      {
        group: 'Expense submission',
        cypress: { file: '27-expenses.test.ts', title: 'a removed test' },
        journeys: [{ file: 'expenses/logged-out.spec.ts', title: 'renamed journey' }],
      },
    ];
    const result = checkInventory({ cypress, playwright, entries: stale, isPilotJourney: pilotFiles });
    expect(result.staleCypress.map(e => e.cypress.title)).toEqual(['a removed test']);
    expect(result.missingJourneys).toEqual([{ file: 'expenses/logged-out.spec.ts', title: 'renamed journey' }]);
    expect(result.complete).toBe(false);
  });

  it('reports pilot journeys that no entry claims, ignoring non-pilot specs', () => {
    const result = checkInventory({
      cypress,
      playwright,
      entries: complete.slice(0, 2),
      isPilotJourney: pilotFiles,
    });
    expect(result.unclaimedJourneys).toEqual([{ file: 'expenses/invite-new-user.spec.ts', title: 'reimbursement' }]);
  });
});
