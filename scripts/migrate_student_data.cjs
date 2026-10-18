const firebase = require('firebase');
require('firebase/firestore');
const fs = require('fs');
const path = require('path');
const { transliterateName, getBatchForToken } = require('./student_transliteration.cjs');

const firebaseConfig = {
  apiKey: "AIzaSyBglBEqEB_tBLV2Vh9Y6NwJJ7gMIhNlvks",
  authDomain: "adsatboard.firebaseapp.com",
  projectId: "adsatboard",
  storageBucket: "adsatboard.appspot.com",
  messagingSenderId: "865352053662",
  appId: "1:865352053662:web:246b95524f3037b1e39c8f"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

async function runMigration() {
  console.log('--- Starting Student Data Migration & Normalization ---');

  const snapshot = await db.collection('students').get();
  console.log(`Found ${snapshot.size} student documents in Firestore.`);

  // 1. Create a full safety backup of current state
  const backup = [];
  snapshot.forEach(doc => {
    backup.push({ id: doc.id, ...doc.data() });
  });

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, `students_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`Safety backup created at: ${backupFile}`);

  // 2. Prepare batch update
  const malayalamRegex = /[\u0D00-\u0D7F]/;
  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const tokenNo = Number(data.tokenNo);

    // Identify Malayalam name
    let nameMl = '';
    if (data.nameMl && malayalamRegex.test(data.nameMl)) {
      nameMl = data.nameMl.trim();
    } else if (data.uname && malayalamRegex.test(data.uname)) {
      nameMl = data.uname.trim();
    } else if (data.name && malayalamRegex.test(data.name)) {
      nameMl = data.name.trim();
    } else if (data.nameEn && malayalamRegex.test(data.nameEn)) {
      nameMl = data.nameEn.trim();
    }

    // English name via transliteration
    const nameEn = transliterateName(nameMl);
    const batchGroup = getBatchForToken(tokenNo);
    const tokenString = String(tokenNo);

    const docRef = db.collection('students').doc(doc.id);
    batch.set(docRef, {
      uname: tokenString,
      username: tokenString,
      nameEn: nameEn,
      nameMl: nameMl,
      name: nameEn,
      batch: batchGroup
    }, { merge: true });

    count++;
  });

  console.log(`Committing batch update for ${count} students...`);
  await batch.commit();
  console.log('--- Migration successfully committed to Firestore! ---');

  // 3. Verification
  const verifySnap = await db.collection('students').get();
  let verifyUnameIsToken = 0;
  let verifyUsernameIsToken = 0;
  let verifyHasNameMl = 0;
  let verifyHasNameEn = 0;

  verifySnap.forEach(d => {
    const val = d.data();
    if (String(val.uname) === String(val.tokenNo)) verifyUnameIsToken++;
    if (String(val.username) === String(val.tokenNo)) verifyUsernameIsToken++;
    if (val.nameMl && malayalamRegex.test(val.nameMl)) verifyHasNameMl++;
    if (val.nameEn && !malayalamRegex.test(val.nameEn) && val.nameEn.length > 0) verifyHasNameEn++;
  });

  console.log('\nMigration Verification Summary:');
  console.log(`Total students: ${verifySnap.size}`);
  console.log(`uname == tokenNo: ${verifyUnameIsToken} / ${verifySnap.size}`);
  console.log(`username == tokenNo: ${verifyUsernameIsToken} / ${verifySnap.size}`);
  console.log(`Valid nameMl: ${verifyHasNameMl} / ${verifySnap.size}`);
  console.log(`Valid nameEn: ${verifyHasNameEn} / ${verifySnap.size}`);

  console.log('\nSample verification records:');
  const sampleDocs = verifySnap.docs.slice(0, 5);
  sampleDocs.forEach(d => {
    const val = d.data();
    console.log(`Token #${val.tokenNo} -> uname: ${val.uname} | username: ${val.username} | Batch: ${val.batch} | EN: "${val.nameEn}" | ML: "${val.nameMl}"`);
  });

  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
