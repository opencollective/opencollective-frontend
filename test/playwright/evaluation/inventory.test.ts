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

  it('records the describe blocks around each test, skipping an options object and braces in strings', () => {
    const source = `
describe('/signup', () => {
  (describe as unknown as Mocha.SuiteFunction)('Individual', { testIsolation: false }, () => {
    it('sends the code', () => { cy.type('{selectall}'); });
  });
  describe('Organization', function () {
    it('sends the code', () => {});
  });
  it('outside the nested blocks', () => {});
});
it('outside every block', () => {});
`;
    expect(extractCypressTests('01-signup.test.ts', source).map(t => t.suites)).toEqual([
      ['/signup', 'Individual'],
      ['/signup', 'Organization'],
      ['/signup'],
      [],
    ]);
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

  it('requires a suite when a title matches several tests, so removing one of them cannot go unnoticed', () => {
    const shared = extractCypressTests(
      '01-signup.test.ts',
      `describe('Individual', () => { it('sends the code', () => {}); });
describe('Organization', () => { it('sends the code', () => {}); });`,
    );
    const journeys = [{ file: 'signup/signup.spec.ts', title: 'signs up' }];
    const byTitle = [{ group: 'Signup', cypress: { file: '01-signup.test.ts', title: 'sends the code' }, journeys }];
    const bySuite = ['Individual', 'Organization'].map(suite => ({
      group: 'Signup',
      cypress: { file: '01-signup.test.ts', title: 'sends the code', suite },
      journeys,
    }));
    const check = entries =>
      checkInventory({ cypress: shared, playwright: journeys, entries, isPilotJourney: () => true });

    expect(check(byTitle).ambiguousCypress.map(e => e.cypress.title)).toEqual(['sends the code']);
    expect(check(byTitle).complete).toBe(false);
    expect(check(bySuite).ambiguousCypress).toEqual([]);
    expect(check(bySuite).complete).toBe(true);
    // Dropping the Organization entry leaves that test unmapped instead of silently covered by the Individual one.
    expect(check(bySuite.slice(0, 1)).unmappedCypress.map(t => t.suites)).toEqual([['Organization']]);
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
