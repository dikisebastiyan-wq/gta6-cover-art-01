// Neon Shore Cover Studio — entrypoint: builds the editor, then runs a
// screenshot scene when the page carries ?shot= in its address.

import { createCoverEditor } from './editor.js';
import { runSceneMode } from './shots.js';

const canvas = document.getElementById('previewCanvas');
if (!canvas) {
  throw new Error('Neon Shore Cover Studio: #previewCanvas is missing from the page.');
}
const editor = createCoverEditor(canvas);

window.neonShoreEditor = editor;

runSceneMode(editor, canvas).catch((error) => {
  editor.announce('Scene mode failed to start.');
  console.error(error);
});
