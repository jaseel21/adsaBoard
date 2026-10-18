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
  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const tokenNo = Number(data.tokenNo);
    const existingUname = data.uname || '';
    const nameEn = transliterateName(existingUname);
    const batchGroup = getBatchForToken(tokenNo);
    const username = String(tokenNo);

    const docRef = db.collection('students').doc(doc.id);
    batch.set(docRef, {
      username: username,
      nameEn: nameEn,
      nameMl: existingUname,
      name: nameEn,
      batch: batchGroup
    }, { merge: true });

    count++;
  });

  console.log(`Committing batch update for ${count} students...`);
  await batch.commit();
  console.log('--- Migration successfully committed to Firestore! ---');

  // Verify
  const verifySnap = await db.collection('students').limit(5).get();
  console.log('\nVerification sample:');
  verifySnap.forEach(d => {
    const val = d.data();
    console.log(`Token #${val.tokenNo} -> Username: ${val.username} | Batch: ${val.batch} | EN: ${val.nameEn} | ML: ${val.nameMl}`);
  });

  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
