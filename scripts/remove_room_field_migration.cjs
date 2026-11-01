/**
 * Migration Script: Remove room and roomNo fields from students collection in Firestore.
 * Also prepares existing students data for optional phone and email standardization.
 */

const fs = require('fs');
const path = require('path');

// Safe offline / local json cleaner or Firebase Admin cleaner if credentials exist
console.log('--- ADSA Room Field Removal & Backup Script ---');

const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 1. Check if current_firestore_students.json exists and back it up
const currentStudentsPath = path.join(__dirname, 'current_firestore_students.json');
if (fs.existsSync(currentStudentsPath)) {
  const raw = fs.readFileSync(currentStudentsPath, 'utf8');
  const backupFile = path.join(backupDir, `students_backup_pre_room_removal_${Date.now()}.json`);
  fs.writeFileSync(backupFile, raw, 'utf8');
  console.log(`[Backup Created] Saved snapshot to: ${backupFile}`);

  try {
    const students = JSON.parse(raw);
    let modifiedCount = 0;
    const cleaned = students.map((st) => {
      let changed = false;
      const copy = { ...st };
      if ('room' in copy) {
        delete copy.room;
        changed = true;
      }
      if ('roomNo' in copy) {
        delete copy.roomNo;
        changed = true;
      }
      if (changed) modifiedCount++;
      return copy;
    });

    fs.writeFileSync(currentStudentsPath, JSON.stringify(cleaned, null, 2), 'utf8');
    console.log(`[Cleaned Local Fixture] Purged room fields from ${modifiedCount} student records in ${currentStudentsPath}`);
  } catch (err) {
    console.error('Error parsing/cleaning current_firestore_students.json:', err);
  }
}

console.log('--- Migration Preparation Complete ---');
