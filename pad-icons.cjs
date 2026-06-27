const { Jimp } = require('jimp');

async function padIcon(filename, outSize) {
  try {
    const img = await Jimp.read(`public/${filename}`);
    const padded = new Jimp({ width: outSize, height: outSize, color: 0x00000000 });
    
    const scaleSize = Math.floor(outSize * 0.75);
    img.resize({ w: scaleSize, h: scaleSize });
    
    padded.composite(img, Math.floor((outSize - scaleSize) / 2), Math.floor((outSize - scaleSize) / 2));
    
    await padded.write(`public/${filename}`);
    console.log(`Padded ${filename}`);
  } catch (err) {
    console.error(`Error padding ${filename}:`, err);
  }
}

async function run() {
  await padIcon('icon-192.png', 192);
  await padIcon('icon-512.png', 512);
}

run();
