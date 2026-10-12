import { existsSync, readdirSync, rmSync } from 'fs';
import path from 'path';

// Cache restoration must not leave artifacts from a previous source tree.
rmSync('dist', { recursive: true, force: true });
if (existsSync('.next')) {
  for (const entry of readdirSync('.next')) {
    if (entry !== 'cache') {
      rmSync(path.join('.next', entry), { recursive: true, force: true });
    }
  }
}
