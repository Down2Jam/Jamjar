import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const root = path.resolve(import.meta.dirname, '../..');
const write = process.argv.includes('--write');
const moduleData = process.argv.includes('--module-data');
const english = JSON.parse(fs.readFileSync(path.join(root, 'src/messages/en.json'), 'utf8'));
const keys = new Map();
const byText = new Map();
function flatten(object, prefix = '') {
  for (const [name, value] of Object.entries(object)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (typeof value === 'string') { keys.set(key, value); if (!byText.has(value)) byText.set(value, key); }
    else flatten(value, key);
  }
}
flatten(english);
const additions = [];
function keyFor(text) {
  if (byText.has(text)) return byText.get(text);
  const base = 'AppStrings.' + (text.match(/[A-Za-z0-9]+/g) ?? ['Message']).map(word => word[0].toUpperCase() + word.slice(1)).join('').slice(0, 85);
  let key = base;
  for (let index = 2; keys.has(key); index++) key = base + index;
  keys.set(key, text); byText.set(text, key); additions.push([key, text]);
  return key;
}
const visibleProps = new Set(['label', 'title', 'description', 'placeholder', 'tooltip', 'alt', 'aria-label', 'emptyMessage', 'loadingText', 'subtitle', 'rule']);
function componentOwner(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isFunctionDeclaration(p) && p.body && p.name && (/^[A-Z]/.test(p.name.text) || /^use[A-Z]/.test(p.name.text) || p.parameters.some(parameter => parameter.name.getText() === 't'))) return p;
    if (ts.isArrowFunction(p) && ts.isBlock(p.body) && ts.isVariableDeclaration(p.parent) && /^[A-Z]|^use[A-Z]/.test(p.parent.name.getText())) return p;
  }
}
function isVisibleExpression(node) {
  let child = node;
  let parent = node.parent;
  while (parent) {
    if (ts.isParenthesizedExpression(parent)) { child = parent; parent = parent.parent; continue; }
    if (ts.isConditionalExpression(parent) && child !== parent.condition) { child = parent; parent = parent.parent; continue; }
    if (ts.isBinaryExpression(parent) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(parent.operatorToken.kind) && child === parent.right) { child = parent; parent = parent.parent; continue; }
    if (ts.isJsxExpression(parent)) return !ts.isJsxAttribute(parent.parent) || visibleProps.has(parent.parent.name.getText());
    if (ts.isPropertyAssignment(parent)) return visibleProps.has(parent.name.getText()) || (parent.name.getText() === 'name' && parent.parent.properties.some(property => property.name?.getText() === 'icon'));
    if (ts.isJsxAttribute(parent)) return visibleProps.has(parent.name.getText());
    if (ts.isCallExpression(parent)) return ['prompt', 'alert', 'confirm', 'setError', 'setMessage', 'setSuccessMessage', 'setErrorMessage', 'setStatusMessage'].includes(parent.expression.getText()) && parent.arguments[0] === child;
    return false;
  }
  return false;
}
function* files(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* files(file);
    else if (/\.tsx$/.test(entry.name)) yield file;
  }
}
const report = [];
let changedFiles = 0;
for (const file of [
  ...files(path.join(root, 'src')),
  ...files(path.join(root, 'packages/bioloom-ui/src')),
  ...files(path.join(root, 'packages/bioloom-miniplayer/src')),
]) {
  if (file.includes(path.sep + 'compat' + path.sep)) continue;
  let source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const owners = new Set();
  function visit(node) {
    // Keyboard glyphs are literal input instructions, never translated prose.
    if (ts.isJsxElement(node) && ['Kbd', 'kbd'].includes(node.openingElement.tagName.getText(ast))) return;
    let value, expression;
    if (ts.isJsxText(node)) value = node.text.replace(/\s+/g, ' ').trim();
    else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && (
      isVisibleExpression(node) ||
      (ts.isJsxAttribute(node.parent) && node.parent.name.getText(ast) === 'name' &&
        node.parent.parent.parent.tagName?.getText(ast) === 'Timer')
    )) value = node.text;
    else if (ts.isTemplateExpression(node) && isVisibleExpression(node)) {
      value = node.head.text;
      const params = [];
      node.templateSpans.forEach((span, index) => { value += `{value${index}}${span.literal.text}`; params.push(`value${index}: ${span.expression.getText(ast)}`); });
      expression = `{ ${params.join(', ')} }`;
    }
    if (value && /[A-Za-z]/.test(value.replace(/\{value\d+\}/g, '')) && !/^\w+(?:\.\w+)+$/.test(value) && !/^https?:|^[\w.+-]+@[\w.-]+$/.test(value)) {
      const owner = componentOwner(node);
      report.push({ file: path.relative(root, file).replaceAll('\\', '/'), line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, text: value, editable: Boolean(owner) });
      if (!owner && moduleData && ts.isStringLiteral(node) && ts.isPropertyAssignment(node.parent)) {
        edits.push({ start: node.getStart(ast), end: node.end, replacement: JSON.stringify(keyFor(value)) });
        return;
      }
      if (owner) {
        const call = `uiText(${JSON.stringify(keyFor(value))}${expression ? ', ' + expression : ''})`;
        let replacement = ts.isJsxText(node) || ts.isJsxAttribute(node.parent) ? `{${call}}` : call;
        if (ts.isJsxText(node)) replacement = (/^\s/.test(node.text) ? ' ' : '') + replacement + (/\s$/.test(node.text) ? ' ' : '');
        edits.push({ start: node.getStart(ast), end: node.end, replacement });
        owners.add(owner);
        return;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!write || !edits.length) continue;
  for (const owner of owners) {
    if (!/const uiText = /.test(owner.body.getText(ast))) edits.push({ start: owner.body.getStart(ast) + 1, end: owner.body.getStart(ast) + 1, replacement: owner.parameters.some(parameter => parameter.name.getText() === 't') ? '\n  const uiText = t;' : '\n  const uiText = useUiTranslations();' });
  }
  for (const edit of edits.sort((a,b) => b.start-a.start)) source = source.slice(0, edit.start) + edit.replacement + source.slice(edit.end);
  if (!source.includes('useTranslations as useUiTranslations')) {
    const importLine = 'import { useTranslations as useUiTranslations } from "@/compat/next-intl";\n';
    source = source.startsWith('"use client";') ? source.replace('"use client";', '"use client";\n\n' + importLine) : importLine + source;
  }
  fs.writeFileSync(file, source); changedFiles++;
}
if (write && additions.length) {
  const csv = path.join(import.meta.dirname, 'Localization.csv');
  const headers = Papa.parse(fs.readFileSync(csv, 'utf8').split(/\r?\n/)[0]).data[0];
  fs.appendFileSync(csv, '\n' + Papa.unparse(additions.map(([key, text]) => headers.map(h => h === 'key' ? key : h === 'en' ? text : ''))) + '\n');
}
fs.writeFileSync(path.join(import.meta.dirname, 'ui-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ candidates: report.length, editable: report.filter(row => row.editable).length, changedFiles, newKeys: additions.length }));
