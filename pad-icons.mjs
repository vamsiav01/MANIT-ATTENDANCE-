import Jimp from 'jimp';

async function padIcon(filename, outSize) {
  try {
    const img = await Jimp.read(`public/${filename}`);
    const padded = new Jimp(outSize, outSize, 0x00000000); // transparent background
    
    // Scale original image to 75% of outSize to give ample padding for circular cropping
    const scaleSize = Math.floor(outSize * 0.75);
    img.resize(scaleSize, scaleSize);
    
    // Paste it in the center
    padded.composite(img, Math.floor((outSize - scaleSize) / 2), Math.floor((outSize - scaleSize) / 2));
    
    await padded.writeAsync(`public/${filename}`);
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
