import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'omnidwnld.db');
    db = new Database(dbPath);
    
    // Initialize tables
    initializeTables();
  }
  return db;
}

function initializeTables() {
  if (!db) return;
  
  // Download history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      format TEXT NOT NULL,
      file_size INTEGER,
      download_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'completed'
    )
  `);
  
  // Usage statistics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      format TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      last_used DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_downloads_platform ON downloads(platform);
    CREATE INDEX IF NOT EXISTS idx_downloads_date ON downloads(download_date);
    CREATE INDEX IF NOT EXISTS idx_stats_platform ON stats(platform);
  `);
}

// Download history functions
export function addDownload(data: {
  platform: string;
  url: string;
  title?: string;
  format: string;
  file_size?: number;
  status?: string;
}) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO downloads (platform, url, title, format, file_size, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    data.platform,
    data.url,
    data.title || 'Untitled',
    data.format,
    data.file_size || 0,
    data.status || 'completed'
  );
}

export function getRecentDownloads(limit = 50) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM downloads 
    ORDER BY download_date DESC 
    LIMIT ?
  `);
  
  return stmt.all(limit);
}

export function getDownloadsByPlatform(platform: string, limit = 20) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM downloads 
    WHERE platform = ?
    ORDER BY download_date DESC 
    LIMIT ?
  `);
  
  return stmt.all(platform, limit);
}

// Stats functions
export function updateStats(platform: string, format: string) {
  const db = getDatabase();
  
  // Check if stat exists
  const existingStat = db.prepare(`
    SELECT * FROM stats WHERE platform = ? AND format = ?
  `).get(platform, format);
  
  if (existingStat) {
    // Update existing stat
    db.prepare(`
      UPDATE stats 
      SET count = count + 1, last_used = CURRENT_TIMESTAMP
      WHERE platform = ? AND format = ?
    `).run(platform, format);
  } else {
    // Insert new stat
    db.prepare(`
      INSERT INTO stats (platform, format)
      VALUES (?, ?)
    `).run(platform, format);
  }
}

export function getTopPlatforms(limit = 10) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT platform, SUM(count) as total_downloads
    FROM stats
    GROUP BY platform
    ORDER BY total_downloads DESC
    LIMIT ?
  `);
  
  return stmt.all(limit);
}

export function getTotalDownloads() {
  const db = getDatabase();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM downloads
  `).get() as { count: number };
  
  return result.count;
}

export default getDatabase;
