#!/usr/bin/env node
/**
 * SnapIt — Manifest Generator (Zero Dependencies)
 *
 * Generates platform-specific Manifest V3 files from canonical `manifest.json`:
 * 1. manifest.chrome.json (Chromium / Google Chrome target with Service Worker & CDP)
 * 2. manifest.firefox.json (Mozilla Firefox target with Gecko ID & Background Scripts)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const basePath = path.join(ROOT_DIR, 'manifest.json');
if (!fs.existsSync(basePath)) {
	console.error('Error: manifest.json not found in repository root.');
	process.exit(1);
}

const baseManifest = JSON.parse(fs.readFileSync(basePath, 'utf8'));

// 1. Generate Chrome / Chromium Manifest V3
const chromeManifest = {
	...baseManifest,
	permissions: [
		...baseManifest.permissions.filter((p) => p !== 'debugger'),
		'debugger'
	],
	background: {
		service_worker: 'service-worker.js'
	}
};

const chromePath = path.join(ROOT_DIR, 'manifest.chrome.json');
fs.writeFileSync(chromePath, JSON.stringify(chromeManifest, null, 2) + '\n', 'utf8');
console.log('✅ Generated Chrome manifest: manifest.chrome.json');

// 2. Generate Mozilla Firefox Manifest V3
const { options_page, ...baseWithoutOptionsPage } = baseManifest;
const firefoxManifest = {
	...baseWithoutOptionsPage,
	author: 'Adommo LLC',
	browser_specific_settings: {
		gecko: {
			id: 'info@adommo.com',
			strict_min_version: '142.0',
			data_collection_permissions: {
				required: ['none']
			}
		}
	},
	permissions: baseManifest.permissions.filter((p) => p !== 'debugger'),
	background: {
		scripts: ['storage-helper.js', 'service-worker.js']
	}
};

const firefoxPath = path.join(ROOT_DIR, 'manifest.firefox.json');
fs.writeFileSync(firefoxPath, JSON.stringify(firefoxManifest, null, 2) + '\n', 'utf8');
console.log('✅ Generated Firefox manifest: manifest.firefox.json');

// 3. Keep dist/chrome/manifest.json synchronized if dist/chrome exists
const distChromeDir = path.join(ROOT_DIR, 'dist', 'chrome');
if (fs.existsSync(distChromeDir)) {
	fs.writeFileSync(
		path.join(distChromeDir, 'manifest.json'),
		JSON.stringify(chromeManifest, null, 2) + '\n',
		'utf8'
	);
	console.log('✅ Synchronized dist/chrome/manifest.json');
}

// 4. Keep dist/firefox/manifest.json synchronized if dist/firefox exists
const distFirefoxDir = path.join(ROOT_DIR, 'dist', 'firefox');
if (fs.existsSync(distFirefoxDir)) {
	fs.writeFileSync(
		path.join(distFirefoxDir, 'manifest.json'),
		JSON.stringify(firefoxManifest, null, 2) + '\n',
		'utf8'
	);
	console.log('✅ Synchronized dist/firefox/manifest.json');
}
