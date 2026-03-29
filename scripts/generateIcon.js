/**
 * Rasterizes public/icons/icon.svg to PNGs at multiple sizes.
 * Run from axess_frontend: node scripts/generateIcon.js
 * Requires: npm i -D sharp
 */
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const svgPath = path.join(__dirname, '../public/icons/icon.svg')
const svgBuffer = fs.readFileSync(svgPath)
const outDir = path.join(__dirname, '../public/icons')

const sizes = [16, 32, 57, 60, 72, 76, 114, 120, 144, 152, 180, 192]

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`))
  console.log(`Created icon-${size}.png`)
}
