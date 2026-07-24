// ไฟล์สำหรับสร้างตาราง students หากยังไม่มี
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // สร้างตาราง students หากยังไม่มี
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id VARCHAR(50) PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ ตาราง students พร้อมใช้งาน');
    client.release();
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างตาราง:', err);
  } finally {
    await pool.end();
  }
}

initDatabase();