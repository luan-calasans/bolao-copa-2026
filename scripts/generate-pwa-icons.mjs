import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const src = 'public/logo.png'
const outDir = 'public/icons'
const background = { r: 7, g: 11, b: 20, alpha: 1 }

await mkdir(outDir, { recursive: true })

for (const size of [192, 512]) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background })
    .png()
    .toFile(`${outDir}/icon-${size}.png`)
}

await sharp(src)
  .resize(180, 180, { fit: 'contain', background })
  .png()
  .toFile(`${outDir}/apple-touch-icon.png`)

await sharp(src)
  .resize(410, 410, { fit: 'contain', background })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background })
  .png()
  .toFile(`${outDir}/icon-maskable-512.png`)

console.log('PWA icons generated in public/icons/')
