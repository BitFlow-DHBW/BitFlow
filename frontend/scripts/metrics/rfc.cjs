#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..', '..');
const srcDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(projectRoot, 'src');
const RFC_MAX = process.env.RFC_MAX ? parseInt(process.env.RFC_MAX, 10) : 10;

function collectFiles(dir) {
  const res = [];
  if (!fs.existsSync(dir)) return res;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === 'coverage') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) res.push(...collectFiles(full));
    else {
      const ext = path.extname(e.name).toLowerCase();
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) res.push(full);
    }
  }
  return res;
}

const classMap = new Map(); // name -> { file, methods:Set, calls:Set }

const files = collectFiles(srcDir);
if (files.length === 0) {
  console.error('No source files found at', srcDir);
  process.exit(0);
}

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const ext = path.extname(file).toLowerCase();
  let kind = ts.ScriptKind.TS;
  if (ext === '.tsx') kind = ts.ScriptKind.TSX;
  else if (ext === '.js') kind = ts.ScriptKind.JS;
  else if (ext === '.jsx') kind = ts.ScriptKind.JSX;
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, kind);

  function visit(node) {
    if (ts.isClassDeclaration(node) && node.name) {
      const className = node.name.text;
      if (!classMap.has(className)) classMap.set(className, { file, methods: new Set(), calls: new Set() });

      node.members.forEach((member) => {
        let methodName = null;
        let bodyNode = null;
        if (ts.isMethodDeclaration(member) || ts.isGetAccessor(member) || ts.isSetAccessor(member)) {
          if (member.name) methodName = member.name.getText(sf);
          bodyNode = member.body;
        } else if (ts.isPropertyDeclaration(member) && member.initializer && (ts.isArrowFunction(member.initializer) || ts.isFunctionExpression(member.initializer))) {
          if (member.name) methodName = member.name.getText(sf);
          bodyNode = member.initializer.body;
        }
        if (methodName) {
          classMap.get(className).methods.add(methodName);
          function findCalls(n) {
            if (!n) return;
            if (ts.isCallExpression(n)) {
              const expr = n.expression;
              if (ts.isPropertyAccessExpression(expr)) {
                const obj = expr.expression.getText(sf);
                const method = expr.name.getText(sf);
                classMap.get(className).calls.add(`${obj}.${method}`);
              } else if (ts.isIdentifier(expr)) {
                classMap.get(className).calls.add(expr.getText(sf));
              }
            }
            ts.forEachChild(n, findCalls);
          }
          findCalls(bodyNode);
        }
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
});

const results = [];
for (const [className, data] of classMap.entries()) {
  // normalize own methods as this.<name> so union count matches call form
  const own = new Set(Array.from(data.methods).map((m) => `this.${m}`));
  const union = new Set(own);
  data.calls.forEach((c) => union.add(c));
  const rfc = union.size;
  results.push({ className, file: data.file, rfc, ownCount: data.methods.size, callsCount: data.calls.size });
}

results.sort((a, b) => b.rfc - a.rfc || a.className.localeCompare(b.className));

console.log('\nRFC (Response For Class) report for', srcDir);
console.log('Threshold (RFC_MAX):', RFC_MAX);
let exceeded = 0;
results.forEach((r) => {
  const flag = r.rfc > RFC_MAX ? '❌' : '✓';
  console.log(`${flag} ${r.className}: RFC=${r.rfc} (methods=${r.ownCount}, calls=${r.callsCount})  — ${path.relative(projectRoot, r.file)}`);
  if (r.rfc > RFC_MAX) exceeded++;
});

if (exceeded > 0) {
  console.error(`\n${exceeded} classes exceed RFC threshold (${RFC_MAX}).`);
  process.exit(1);
} else {
  console.log('\nNo classes exceed the RFC threshold.');
  process.exit(0);
}
