/**
 * Refreshes the list of Cloudflare IP ranges that Express trusts as proxies (`server/cloudflare-ips.json`),
 * from Cloudflare's public `GET /ips` endpoint. Runs at build time to refresh the copy in `dist/`; a failure only
 * logs a warning so the last known list is kept.
 */
import { writeFileSync } from 'fs';

const output = process.argv[2] || 'server/cloudflare-ips.json';

fetch('https://api.cloudflare.com/client/v4/ips', { signal: AbortSignal.timeout(10_000) })
  .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
  .then(({ result: { ipv4_cidrs: ipv4, ipv6_cidrs: ipv6 } }) => {
    writeFileSync(output, `${JSON.stringify([...ipv4, ...ipv6], null, 2)}\n`);
    console.log(`Wrote ${ipv4.length + ipv6.length} Cloudflare IP ranges to ${output}`);
  })
  .catch(error => console.warn(`Could not refresh Cloudflare IP ranges, keeping ${output}: ${error.message}`));
