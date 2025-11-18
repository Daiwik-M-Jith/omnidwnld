const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'omnidwnld.db');
console.log('Opening DB at', dbPath);
let db;
try {
  db = new Database(dbPath, { readonly: true });
} catch (err) {
  console.error('Failed to open DB:', err.message);
  process.exit(1);
}

function safeRun(query, params = []) {
  try {
    return db.prepare(query).all(...params);
  } catch (e) {
    return { error: e.message };
  }
}

console.log('\nTables and counts:');
const tables = safeRun("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log(tables);

const downloadsCount = safeRun('SELECT COUNT(*) as cnt FROM downloads');
console.log('\nDownloads count:', downloadsCount);

const statsCount = safeRun('SELECT COUNT(*) as cnt FROM stats');
console.log('Stats count:', statsCount);

console.log('\nMost recent 10 downloads:');
const recent = safeRun('SELECT id, platform, url, title, format, file_size, download_date, status FROM downloads ORDER BY download_date DESC LIMIT 10');
console.log(recent);

console.log('\nTop platforms from stats (limit 10):');
const top = safeRun('SELECT platform, SUM(count) as total FROM stats GROUP BY platform ORDER BY total DESC LIMIT 10');
console.log(top);

console.log('\nDone.');
