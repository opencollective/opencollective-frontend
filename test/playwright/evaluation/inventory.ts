/**
 * Coverage inventory of the Playwright pilots: every test of the original
 * Cypress pilot files is accounted for by Playwright journeys, an explicit
 * consolidation, or an explicit gap. See docs/e2e.md (Pilot evaluation).
 */

type TestRef = { file: string; title: string };

type CypressTest = TestRef & {
  /** Source line of the `it(` call. */
  line: number;
  /** Titles of the `describe` blocks around the `it(`, outermost first. */
  suites: string[];
  /** Whether a concrete title (placeholders expanded) comes from this `it(`. */
  matches: (title: string) => boolean;
};

export type InventoryEntry = {
  group: string;
  /**
   * Concrete Cypress title, with any `${...}` placeholder expanded. `suite` names one of the `describe` blocks
   * around it, and is required when the title alone matches several tests of the file.
   */
  cypress: TestRef & { suite?: string };
  journeys: TestRef[];
  /** Set when several Cypress tests share one journey, or a journey carries part of a test. */
  note?: string;
  /** Set when no journey covers this Cypress test yet: the pilot does not preserve it. */
  gap?: string;
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Index of the `}` closing the block opened at `open`. Strings, template literals and comments are skipped, so
 * braces inside them (`'{selectall}'`) do not count.
 */
function blockEnd(source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    if (char === '/' && source[i + 1] === '/') {
      i = source.indexOf('\n', i);
      if (i === -1) {
        break;
      }
    } else if (char === '/' && source[i + 1] === '*') {
      i = source.indexOf('*/', i + 2) + 1;
    } else if (char === "'" || char === '"' || char === '`') {
      for (i++; i < source.length && source[i] !== char; i++) {
        if (source[i] === '\\') {
          i++;
        }
      }
    } else if (char === '{') {
      depth++;
    } else if (char === '}' && --depth === 0) {
      return i;
    }
  }
  return source.length;
}

/** The `describe(` blocks of a source, including a cast form such as `(describe as unknown as Fn)(`. */
function describeBlocks(source: string) {
  const pattern = /\bdescribe\b(?:\.skip|\.only)?(?:\s+as\s+[^)]*\))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  // The body is the callback's: an options object such as `{ testIsolation: false }` can come first.
  const callback = /(?:=>|\bfunction\b[^{]*?\))\s*\{/g;
  return [...source.matchAll(pattern)].map(match => {
    callback.lastIndex = match.index + match[0].length;
    const body = callback.exec(source);
    const open = body ? body.index + body[0].length - 1 : -1;
    return { title: match[2], start: match.index, end: open === -1 ? source.length : blockEnd(source, open) };
  });
}

/** Reads the `it(` titles of a Cypress file. A `${...}` placeholder matches any non-empty text. */
export function extractCypressTests(file: string, source: string): CypressTest[] {
  const tests: CypressTest[] = [];
  const blocks = describeBlocks(source);
  const pattern = /\bit(?:\.skip|\.only)?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  for (const match of source.matchAll(pattern)) {
    const title = match[2];
    const line = source.slice(0, match.index).split('\n').length;
    const suites = blocks.filter(block => block.start < match.index && match.index < block.end).map(b => b.title);
    const regex = new RegExp(
      `^${title
        .split(/\$\{[^}]*\}/)
        .map(escapeRegExp)
        .join('.+')}$`,
    );
    tests.push({ file, title, line, suites, matches: candidate => regex.test(candidate) });
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
  const isSourceOf = (entry: InventoryEntry, test: CypressTest) =>
    test.file === entry.cypress.file &&
    test.matches(entry.cypress.title) &&
    (!entry.cypress.suite || test.suites.includes(entry.cypress.suite));
  const sourcesOf = (entry: InventoryEntry) => cypress.filter(test => isSourceOf(entry, test));

  const unmappedCypress = cypress.filter(test => !entries.some(entry => isSourceOf(entry, test)));
  const staleCypress = entries.filter(entry => sourcesOf(entry).length === 0);
  // An entry standing for several tests would keep reporting them covered after one of them is removed.
  const ambiguousCypress = entries.filter(entry => sourcesOf(entry).length > 1);
  const claimed = entries.flatMap(entry => entry.journeys);
  const missingJourneys = claimed.filter(journey => !playwright.some(test => sameTest(test, journey)));
  const unclaimedJourneys = playwright.filter(
    test => isPilotJourney(test.file) && !claimed.some(journey => sameTest(journey, test)),
  );
  const gaps = entries.filter(entry => entry.gap || entry.journeys.length === 0);
  const complete =
    unmappedCypress.length === 0 &&
    staleCypress.length === 0 &&
    ambiguousCypress.length === 0 &&
    missingJourneys.length === 0 &&
    unclaimedJourneys.length === 0;

  return {
    unmappedCypress,
    staleCypress,
    ambiguousCypress,
    missingJourneys,
    unclaimedJourneys,
    gaps,
    /** Every test on both sides is accounted for (a recorded gap counts as accounted for). */
    complete,
    /** Accounted for, and no Cypress test is left without a journey. */
    coversAllCoreFlows: complete && gaps.length === 0,
  };
}
