// MÜŞTERİ MENÜSÜNDE BROWSER CONSOLE'A YAPIŞTIR
// Bu script NotificationButtons'ın render olup olmadığını kontrol eder

console.clear();
console.log('========================================');
console.log('MÜŞTERİ BUTONLARI DEBUG');
console.log('========================================\n');

// 1. FAB butonu var mı?
const fabButton = document.querySelector('button[type="button"]');
console.log('1. FAB Butonu var mı?', fabButton ? '✅ EVET' : '❌ YOK');

if (fabButton) {
  console.log('   FAB buton HTML:', fabButton.outerHTML.substring(0, 100) + '...');
}

// 2. Portal içindeki butonlar
const allButtons = document.querySelectorAll('button');
console.log('\n2. Toplam buton sayısı:', allButtons.length);

// 3. createPortal ile oluşturulan elementler
const portals = document.querySelectorAll('body > div');
console.log('\n3. Body altındaki div sayısı (portal):', portals.length);

portals.forEach((portal, index) => {
  const buttons = portal.querySelectorAll('button');
  if (buttons.length > 0) {
    console.log(`   Portal ${index + 1}: ${buttons.length} buton var`);
  }
});

// 4. Sağ alt köşede fixed element var mı?
const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
  const style = window.getComputedStyle(el);
  return style.position === 'fixed';
});
console.log('\n4. Fixed position elementler:', fixedElements.length);

fixedElements.forEach((el, index) => {
  const rect = el.getBoundingClientRect();
  console.log(`   Element ${index + 1}:`, {
    tag: el.tagName,
    class: el.className.substring(0, 50),
    position: `x:${Math.round(rect.x)}, y:${Math.round(rect.y)}`,
    size: `${Math.round(rect.width)}x${Math.round(rect.height)}`
  });
});

// 5. NotificationButtons component mount oldu mu?
// React dev tools varsa
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('\n5. ✅ React DevTools var - Components sekmesinden NotificationButtons ara');
} else {
  console.log('\n5. ❌ React DevTools yok - kurmalısın');
}

console.log('\n========================================');
console.log('SONUÇ:');
console.log('========================================');

if (fabButton || fixedElements.length > 0) {
  console.log('✅ NotificationButtons RENDER OLMUŞ');
  console.log('   → Sağ alt köşede turuncu yuvarlak buton olmalı');
  console.log('   → Eğer görünmüyorsa CSS sorunu var (z-index veya opacity)');
} else {
  console.log('❌ NotificationButtons RENDER OLMADI');
  console.log('   → CustomerMenu\'de conditional rendering var');
  console.log('   → table veya canOrder false olabilir');
  console.log('   → Component import edilmemiş olabilir');
}

console.log('\n========================================');
console.log('MANUEL TEST:');
console.log('========================================');
console.log('1. Console\'da "🔔 NotificationButtons BAŞLATILDI" logunu gördün mü?');
console.log('2. Sağ alt köşede turuncu yuvarlak buton görüyor musun?');
console.log('3. Network sekmesinde Firebase isteği var mı?');
