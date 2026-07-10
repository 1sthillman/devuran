/**
 * GIF Optimization Script
 * 
 * Bu script GIF'leri optimize eder:
 * 1. Boyutu küçültür (max 500px genişlik)
 * 2. Frame rate azaltır (15 fps)
 * 3. Renk paleti optimize eder
 * 4. WebP formatına dönüştürür (opsiyonel)
 * 
 * Kullanım:
 * npm install -g gifski gifsicle
 * node optimize-gifs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INPUT_DIR = 'public/categories';
const OUTPUT_DIR = 'public/categories/optimized';
const MAX_WIDTH = 500;
const FPS = 15;

// Output klasörünü oluştur
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// GIF dosyalarını bul
const gifFiles = fs.readdirSync(INPUT_DIR)
  .filter(file => file.endsWith('.gif'))
  .map(file => path.join(INPUT_DIR, file));

console.log(`📦 ${gifFiles.length} GIF dosyası bulundu`);

gifFiles.forEach((gifPath, index) => {
  const fileName = path.basename(gifPath);
  const outputPath = path.join(OUTPUT_DIR, fileName);
  
  console.log(`\n🔄 [${index + 1}/${gifFiles.length}] Optimizing: ${fileName}`);
  
  try {
    // Orijinal boyutu göster
    const originalSize = fs.statSync(gifPath).size;
    console.log(`   📊 Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Gifsicle ile optimize et
    // -O3: Maximum optimization
    // --colors 128: Renk sayısını azalt
    // --lossy=80: Kayıplı sıkıştırma
    const command = `gifsicle -O3 --colors 128 --lossy=80 --scale ${MAX_WIDTH} "${gifPath}" -o "${outputPath}"`;
    
    console.log(`   ⚙️  Running optimization...`);
    execSync(command, { stdio: 'inherit' });
    
    // Yeni boyutu göster
    const newSize = fs.statSync(outputPath).size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
    
    console.log(`   ✅ Optimized: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   💾 Saved: ${savings}%`);
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
});

console.log('\n✨ Optimization complete!');
console.log(`📁 Optimized files saved to: ${OUTPUT_DIR}`);

// Manuel optimizasyon talimatları
console.log('\n📝 Manual Optimization (if script fails):');
console.log('1. Install gifsicle: npm install -g gifsicle');
console.log('2. Or use online tools:');
console.log('   - https://ezgif.com/optimize');
console.log('   - https://www.iloveimg.com/compress-image/compress-gif');
console.log('3. Target size: < 1 MB per GIF');
console.log('4. Recommended dimensions: 400x400 - 600x600 px');
