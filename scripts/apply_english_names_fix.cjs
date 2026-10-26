const firebase = require('firebase');
require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

async function runUpdate() {
  console.log('--- Starting English Name Correction from Official Document ---');

  // Load update plan
  const planPath = path.join(__dirname, 'proposed_update_plan.json');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

  const updates = plan.filter(p => p.action === 'update');
  const skippedFs = plan.filter(p => p.action === 'skip_fs_untouched');
  const skippedDoc = plan.filter(p => p.action === 'doc_not_in_web');

  console.log(`Plan contains ${updates.length} updates, ${skippedFs.length} skipped web tokens, ${skippedDoc.length} doc entries not in web.`);

  // 1. Create a safety backup
  console.log('Fetching live student documents for safety backup...');
  const snapshot = await db.collection('students').get();
  console.log(`Retrieved ${snapshot.size} live student documents.`);

  const backupData = [];
  const currentMap = new Map();
  snapshot.forEach(doc => {
    const data = doc.data();
    backupData.push({ id: doc.id, ...data });
    currentMap.set(doc.id, data);
  });

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, `students_backup_before_english_fix_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`Safety backup successfully saved to: ${backupFile}`);

  // 2. Prepare Batch update
  const batch = db.batch();
  let updateCount = 0;

  for (const item of updates) {
    const docRef = db.collection('students').doc(item.doc_id);
    
    // Explicit safety check: verify doc exists
    if (!currentMap.has(item.doc_id)) {
      throw new Error(`Document ID ${item.doc_id} not found in Firestore!`);
    }

    // Only update nameEn and name. Absolutely NO change to tokenNo, nameMl, uname, etc.
    batch.update(docRef, {
      nameEn: item.new_nameEn,
      name: item.new_nameEn
    });
    updateCount++;
  }

  console.log(`Committing Firestore batch update for ${updateCount} students...`);
  await batch.commit();
  console.log('Firestore batch update successfully committed!');

  // 3. Post-update verification
  console.log('\n--- Verifying Database Post-Update ---');
  const verifySnap = await db.collection('students').get();
  let verifiedCount = 0;
  let untouchedCount = 0;

  const skippedTokenSet = new Set(skippedFs.map(s => s.tokenNo));

  verifySnap.forEach(doc => {
    const data = doc.data();
    const tokenNo = Number(data.tokenNo);

    if (skippedTokenSet.has(tokenNo)) {
      untouchedCount++;
    } else {
      const targetUpdate = updates.find(u => u.doc_id === doc.id);
      if (targetUpdate) {
        if (data.nameEn === targetUpdate.new_nameEn && data.name === targetUpdate.new_nameEn) {
          verifiedCount++;
        } else {
          console.error(`Verification mismatch for Token #${tokenNo}: expected "${targetUpdate.new_nameEn}", found "${data.nameEn}"`);
        }
      }
    }
  });

  console.log(`Verification Results:`);
  console.log(`- Correctly updated: ${verifiedCount} / ${updates.length}`);
  console.log(`- Untouched remaining students: ${untouchedCount} / ${skippedFs.length}`);
  console.log(`- Total students in DB: ${verifySnap.size}`);

  if (verifiedCount === updates.length && untouchedCount === skippedFs.length) {
    console.log('✅ ALL CHECKS PASSED PERFECTLY!');
  } else {
    console.warn('⚠️ Some verification checks did not match expected totals.');
  }

  process.exit(0);
}

runUpdate().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
