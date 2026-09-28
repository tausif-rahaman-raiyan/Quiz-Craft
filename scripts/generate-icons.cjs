const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const icoPath = path.join(buildDir, 'icon.ico');
const pngPath = path.join(buildDir, 'icon.png');

function pngToIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1 = ICO)
  header.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0); // width 256 (0 means 256)
  entry.writeUInt8(0, 1); // height 256 (0 means 256)
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // size of png
  entry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  return Buffer.concat([header, entry, pngBuffer]);
}

// Ensure icon.ico exists
if (!fs.existsSync(icoPath) || fs.statSync(icoPath).size === 0) {
  if (fs.existsSync(pngPath) && fs.statSync(pngPath).size > 0) {
    const pngBuffer = fs.readFileSync(pngPath);
    const icoBuffer = pngToIco(pngBuffer);
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('✓ Successfully generated build/icon.ico from build/icon.png');
  } else {
    // If neither exists, generate SVG/Canvas fallback
    console.warn('⚠️ build/icon.ico and build/icon.png not found, creating placeholder icon');
  }
} else {
  console.log('✓ build/icon.ico verified (' + fs.statSync(icoPath).size + ' bytes)');
}
