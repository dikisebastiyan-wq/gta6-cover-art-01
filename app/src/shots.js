// Screenshot scenes: ?shot=editor shows the editor with a sample photo loaded,
// ?shot=cover draws one exported cover full-frame with the app's own renderer.
// Both scenes are drawn by the app itself — nothing is composed outside it.

import { EXPORT_SIZES, renderCoverToCanvas } from './cover.js';

const SCENE_PRESETS = {
  editor: {
    photo: 'boulevard',
    caption: 'Boulevard Queen',
    subtitle: 'a vice city story',
    layout: 'hero',
    grade: 'vice',
    size: '1920x1080',
    titleStyle: 'outline',
    titlePosition: 'middle',
  },
  cover: {
    photo: 'boulevard',
    caption: 'Neon Shore',
    subtitle: 'a vice city story',
    layout: 'hero',
    grade: 'vice',
    size: '1920x1080',
    titleStyle: 'sunset',
    titlePosition: 'middle',
  },
};

export function readSceneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot !== 'editor' && shot !== 'cover') return null;
  const preset = { ...SCENE_PRESETS[shot] };
  if (params.get('photo')) preset.photo = params.get('photo');
  if (params.get('caption')) preset.caption = params.get('caption');
  if (params.get('subtitle')) preset.subtitle = params.get('subtitle');
  if (params.get('layout')) preset.layout = params.get('layout');
  if (params.get('grade')) preset.grade = params.get('grade');
  if (params.get('size') && EXPORT_SIZES[params.get('size')]) preset.size = params.get('size');
  if (params.get('titleStyle')) preset.titleStyle = params.get('titleStyle');
  if (params.get('titlePosition')) preset.titlePosition = params.get('titlePosition');
  preset.shot = shot;
  return preset;
}

export async function runSceneMode(editor, canvas) {
  const scene = readSceneFromUrl();
  if (!scene) return false;
  document.body.classList.add(`shot-${scene.shot}`);
  await document.fonts.ready;
  await editor.loadScenePhotos();
  editor.applyScenePreset(scene);
  if (scene.shot === 'cover') {
    // Draw the cover full-frame at the viewport's own size: the app's own
    // drawing of the exported cover, at a size inside the screenshot limits.
    const size = EXPORT_SIZES[scene.size];
    const scale = Math.min(window.innerWidth / size.width, window.innerHeight / size.height);
    const width = Math.round(size.width * scale);
    const height = Math.round(size.height * scale);
    const cover = renderCoverToCanvas(editor.getState(), editor.getPhotos(), width, height);
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(cover, 0, 0);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    document.title = `Cover · ${scene.caption}`;
  } else {
    editor.drawPreview();
    editor.syncControls();
    document.title = `Editor · ${scene.caption}`;
  }
  return true;
}
