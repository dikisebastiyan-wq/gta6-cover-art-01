// Neon Shore Cover Studio — the entry program (Node 22, standard library only).
//
// The app is plain static files under app/ (an offline cover-art maker that
// runs in a desktop browser), and this program hands it in: it copies app/
// and screenshots/ from beside this file into the output directory and
// writes /output/dossier.json with the vendored make.fun dossier library.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program is deterministic: two runs write the same bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly, before copying anything, when the entry is incomplete.
if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
  throw new Error('main.ts: app/index.html is missing, the entry is incomplete');
}
if (!existsSync(join(repoRoot, 'screenshots'))) {
  throw new Error('main.ts: screenshots/ is missing, the entry is incomplete');
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The sealed gate's caps (reference/gate.json): only text_max_bytes shapes
// the dossier bytes; the rest refuse an entry the scorer would refuse.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
