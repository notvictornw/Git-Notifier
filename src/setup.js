#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'config.yml');
const example = path.join(root, 'config.yml.example');

if (fs.existsSync(target)) {
  console.log('config.yml already exists. No changes made.');
  process.exit(0);
}

if (!fs.existsSync(example)) {
  console.error('config.yml.example not found.');
  process.exit(1);
}

fs.copyFileSync(example, target);
console.log('Created config.yml from config.yml.example.');
console.log('Next: edit config.yml and set github.secret + repositories["owner/repo"].discord');
console.log('Optional: set GITHUB_TOKEN/GITHUB_WEBHOOK_SECRET env vars for env-only setups.');