/**
 * Rasterizes public/icons/icon.svg to public/icons/icon-192.png (192×192).
 * Run from repo root: node scripts/generateIcon.js
 * Requires: npm i -D sharp
 */
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const src = path.join(root, 'public/icons/icon.svg')
const dest = path.join(root, 'public/icons/icon-192.png')

await sharp(src).resize(192, 192).png().toFile(dest)
console.log('Wrote', dest)
