const { execSync } = require('child_process');

// Her index için ayrı JSON dosyası oluştur ve deploy et
const indexes = require('./firestore.indexes.json');

console.log('🔥 Index oluşturma başlıyor...');
console.log(`📊 Toplam ${indexes.indexes.length} index oluşturulacak\n`);

// Manuel olarak Firebase Console'dan index linklerini kullan
console.log('⚠️  Firebase CLI ile toplu index oluşturma desteklenmiyor.');
console.log('📝 Lütfen aşağıdaki linklere tıklayarak index\'leri oluşturun:\n');

const baseUrl = 'https://console.firebase.google.com/v1/r/project/ruloposs/firestore/indexes?create_composite=';

const createIndexUrl = (collectionGroup, fields) => {
  const fieldsStr = fields.map(f => {
    const order = f.order === 'ASCENDING' ? '1' : '2';
    return `${f.fieldPath}:${order}`;
  }).join(',');
  return `${collectionGroup}/${fieldsStr}`;
};

indexes.indexes.forEach((index, i) => {
  console.log(`${i + 1}. ${index.collectionGroup}:`);
  const fields = index.fields.map(f => `${f.fieldPath} (${f.order})`).join(' + ');
  console.log(`   Fields: ${fields}`);
  console.log('');
});

console.log('\n💡 Alternatif: Firebase Console > Firestore > Indexes sekmesine gidin ve "Add Index" butonuna tıklayın.');
