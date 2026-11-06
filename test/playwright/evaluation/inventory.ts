/**
 * Coverage inventory of the Playwright pilots: every test of the original
 * Cypress pilot files is accounted for by Playwright journeys, an explicit
 * consolidation, or an explicit gap. See docs/e2e.md (Pilot evaluation).
 */

type TestRef = { file: string; title: string };

type CypressTest = TestRef & {
  /** Source line of the `it(` call. */
  line: number;
  /** Whether a concrete title (placeholders expanded) comes from this `it(`. */
  matches: (title: string) => boolean;
};

export type InventoryEntry = {
  group: string;
  /** Concrete Cypress title, with any `${...}` placeholder expanded. */
  cypress: TestRef;
  journeys: TestRef[];
  /** Set when several Cypress tests share one journey, or a journey carries part of a test. */
  note?: string;
  /** Set when no journey covers this Cypress test yet: the pilot does not preserve it. */
  gap?: string;
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Reads the `it(` titles of a Cypress file. A `${...}` placeholder matches any non-empty text. */
export function extractCypressTests(file: string, source: string): CypressTest[] {
  const tests: CypressTest[] = [];
  const pattern = /\bit(?:\.skip|\.only)?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  for (const match of source.matchAll(pattern)) {
    const title = match[2];
    const line = source.slice(0, match.index).split('\n').length;
    const regex = new RegExp(
      `^${title
        .split(/\$\{[^}]*\}/)
        .map(escapeRegExp)
        .join('.+')}$`,
    );
    tests.push({ file, title, line, matches: candidate => regex.test(candidate) });
  }
  return tests;
}

type ListSuite = { title: string; file?: string; specs?: Array<{ title: string }>; suites?: ListSuite[] };

/** Flattens `playwright test --list --reporter=json` into file plus describe › test titles. */
export function listPlaywrightTests(report: { suites: ListSuite[] }): TestRef[] {
  const tests: TestRef[] = [];
  const walk = (suite: ListSuite, file: string, path: string[]) => {
    for (const spec of suite.specs ?? []) {
      tests.push({ file, title: [...path, spec.title].join(' › ') });
    }
    for (const child of suite.suites ?? []) {
      walk(child, file, [...path, child.title]);
    }
  };
  for (const fileSuite of report.suites) {
    walk(fileSuite, fileSuite.file ?? fileSuite.title, []);
  }
  return tests;
}

const sameTest = (a: TestRef, b: TestRef) => a.file === b.file && a.title === b.title;

export function checkInventory({
  cypress,
  playwright,
  entries,
  isPilotJourney,
}: {
  cypress: CypressTest[];
  playwright: TestRef[];
  entries: InventoryEntry[];
  isPilotJourney: (file: string) => boolean;
}) {
  const sourceOf = (entry: InventoryEntry) =>
    cypress.find(test => test.file === entry.cypress.file && test.matches(entry.cypress.title));

  const unmappedCypress = cypress.filter(
    test => !entries.some(entry => entry.cypress.file === test.file && test.matches(entry.cypress.title)),
  );
  const staleCypress = entries.filter(entry => !sourceOf(entry));
  const claimed = entries.flatMap(entry => entry.journeys);
  const missingJourneys = claimed.filter(journey => !playwright.some(test => sameTest(test, journey)));
  const unclaimedJourneys = playwright.filter(
    test => isPilotJourney(test.file) && !claimed.some(journey => sameTest(journey, test)),
  );
  const gaps = entries.filter(entry => entry.gap || entry.journeys.length === 0);
  const complete =
    unmappedCypress.length === 0 &&
    staleCypress.length === 0 &&
    missingJourneys.length === 0 &&
    unclaimedJourneys.length === 0;

  return {
    unmappedCypress,
    staleCypress,
    missingJourneys,
    unclaimedJourneys,
    gaps,
    /** Every test on both sides is accounted for (a recorded gap counts as accounted for). */
    complete,
    /** Accounted for, and no Cypress test is left without a journey. */
    coversAllCoreFlows: complete && gaps.length === 0,
  };
}
