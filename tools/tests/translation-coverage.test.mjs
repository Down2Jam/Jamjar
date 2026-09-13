import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '../..');
function flatten(object, prefix = '', result = {}) {
  for (const [name, value] of Object.entries(object)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (typeof value === 'string') result[key] = value;
    else flatten(value, key, result);
  }
  return result;
}
const english = flatten(JSON.parse(fs.readFileSync(path.join(root, 'src/messages/en.json'), 'utf8')));
const meow = flatten(JSON.parse(fs.readFileSync(path.join(root, 'src/messages/mis-meow.json'), 'utf8')));
test('Meow covers every English message and preserves interpolation placeholders', () => {
  for (const [key, text] of Object.entries(english)) {
    assert.ok(meow[key]?.trim(), `Missing Meow translation: ${key}`);
    const placeholders = value => [...new Set(value.match(/\{[^}]+\}/g) ?? [])].sort();
    assert.deepEqual(placeholders(meow[key]), placeholders(text), key);
  }
});
function* sourceFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(file);
    else if (/\.tsx?$/.test(file)) yield file;
  }
}
test('Explicit translation references exist in the English catalog', () => {
  for (const directory of ['src', 'packages/bioloom-ui/src', 'packages/bioloom-miniplayer/src']) {
    for (const file of sourceFiles(path.join(root, directory))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const [, key] of source.matchAll(/\b(?:t|uiText)\("(AppStrings\.[\w.]+|AdminJamGames\.[\w.]+|Countdown\.[\w.]+)"/g)) {
        assert.equal(typeof english[key], 'string', `${file}: ${key}`);
      }
    }
  }
});

test('Keyboard hints stay literal and countdown labels use catalog entries', () => {
  for (const file of sourceFiles(path.join(root, 'src'))) {
    const source = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxElement(node) && ['kbd', 'Kbd'].includes(node.openingElement.tagName.getText(ast))) {
        assert.doesNotMatch(node.getText(ast), /\b(?:t|uiText)\(/, `Translated keyboard hint in ${file}`);
      }
      if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(ast) === 'Timer') {
        const name = node.attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.getText(ast) === 'name');
        if (name?.initializer && ts.isStringLiteral(name.initializer)) {
          assert.equal(typeof english[name.initializer.text], 'string', `Untranslated timer label in ${file}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
});

test('System labels translate known values and preserve custom labels and license codes', async () => {
  const source = fs.readFileSync(path.join(root, 'src/helpers/systemLabels.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  const { SYSTEM_LABEL_KEYS, translateSystemLabel } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  for (const key of Object.values(SYSTEM_LABEL_KEYS)) {
    assert.ok(english[key], key);
    assert.ok(meow[key], key);
  }
  for (const label of ['Composer', 'Arranger', 'All rights reserved', 'General', 'Development', 'Introduction', 'SiteAnnouncement']) {
    assert.notEqual(translateSystemLabel(label, key => meow[key]), label);
  }
  for (const label of ['Ategon', 'My custom tag', 'CC BY-NC-SA', 'CC0']) {
    assert.equal(translateSystemLabel(label, key => meow[key]), label);
  }
  for (const file of ['components/track-editing-form/TrackEditingForm.tsx', 'components/game-editing-form/GameEditingForm.tsx']) {
    const component = fs.readFileSync(path.join(root, 'src', file), 'utf8');
    assert.match(component, /value=\{role\}/);
    assert.doesNotMatch(component, /value=\{translateSystemLabel/);
  }
});
