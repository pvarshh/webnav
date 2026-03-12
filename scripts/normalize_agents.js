#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');

function normalizeFile(filePath) {
  let s = fs.readFileSync(filePath, 'utf8');

  // Remove stray prefixes like leading 'yeah ' before headers
  s = s.replace(/^\s*yeah\s+/i, '');

  // Normalize opening and closing fences: replace any opening fence of 3+ backticks with exactly 3
  s = s.replace(/^```{3,}chatagent/m, '```chatagent');
  s = s.replace(/\n```{3,}\s*$/m, '\n```');

  // If an Agent Configuration section is missing, inject a canonical short block after the first persona paragraph
  if (!/Agent Configuration/.test(s)) {
    // Insert after the first "You are" paragraph
    const marker = /(^```chatagent\n[\s\S]*?\n\n)/i;
    const match = s.match(marker);
    if (match) {
      const insertAt = match.index + match[0].length;
      const configBlock = '\n### Agent Configuration\n\n- **Output Mode:** Markdown only. Do NOT emit raw JSON or `responseMeta` metadata.\n- **Code Blocks:** Use language-labeled fenced blocks and include target paths when requesting the extension to save files.\n- **Behavior:** Avoid embedding runtime/tool metadata in responses.\n\n';
      s = s.slice(0, insertAt) + configBlock + s.slice(insertAt);
    }
  }

  fs.writeFileSync(filePath, s, 'utf8');
  console.log('Normalized', path.basename(filePath));
}

fs.readdirSync(AGENTS_DIR).forEach(f => {
  const full = path.join(AGENTS_DIR, f);
  if (fs.statSync(full).isFile() && f.endsWith('.md')) {
    try {
      normalizeFile(full);
    } catch (err) {
      console.error('Failed to normalize', f, err.message);
    }
  }
});

console.log('Agent normalization complete.');
