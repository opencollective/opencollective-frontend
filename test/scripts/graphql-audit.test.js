import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SCRIPT = path.join(__dirname, '../../scripts/graphql-audit.js');

// Runs the audit (it scans its working directory) on a single fixture file
const audit = (source, args = []) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-audit-'));
  try {
    fs.writeFileSync(path.join(dir, 'fixture.ts'), source);
    const { status, stdout } = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: 'utf8' });
    return { status, violations: stdout.split('\n').filter(line => line.startsWith('[')) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

describe('scripts/graphql-audit', () => {
  it('passes on names that follow RFC 011', () => {
    const result = audit(
      [
        'const accountQuery = gql`',
        '  query Account($slug: String!) {',
        '    account(slug: $slug) { id }',
        '  }',
        '`;',
        'const addAccountQuery = graphql(accountQuery);',
      ].join('\n'),
    );
    expect(result).toEqual({ status: 0, violations: [] });
  });

  it('reports operation, variable and HOC names that break the rules', () => {
    const result = audit(
      [
        'const ACCOUNT_QUERY = gql`',
        '  query GetAccountQuery {',
        '    me { id }',
        '  }',
        '`;',
        'const withAccount = graphql(ACCOUNT_QUERY);',
      ].join('\n'),
    );
    expect(result.status).toBe(1);
    expect(result.violations).toEqual([
      '[Operation Name] fixture.ts:1 -> "GetAccountQuery"',
      '[Variable Name] fixture.ts:1 -> "ACCOUNT_QUERY"',
      expect.stringContaining('[HOC Name] fixture.ts:6 -> "withAccount"'),
    ]);
  });

  it('checks a template that closes on its opening line, and the declarations after it', () => {
    const result = audit(
      [
        'const meQuery = gql`query MeQuery { me { id } }`;',
        'const BadName = gql`',
        '  query Other {',
        '    me { id }',
        '  }',
        '`;',
      ].join('\n'),
    );
    expect(result.status).toBe(1);
    expect(result.violations).toEqual([
      '[Operation Name] fixture.ts:1 -> "MeQuery"',
      '[Variable Name] fixture.ts:2 -> "BadName"',
    ]);
  });

  it('restricts the run to the rules given as flags', () => {
    const source = 'const BadName = gql`query GoodName { me { id } }`;';
    expect(audit(source, ['-o'])).toEqual({ status: 0, violations: [] });
    expect(audit(source, ['-v']).violations).toEqual(['[Variable Name] fixture.ts:1 -> "BadName"']);
  });
});
