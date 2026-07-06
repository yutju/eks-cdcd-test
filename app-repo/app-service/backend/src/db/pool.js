// backend/src/db/pool.js
// PostgreSQL(pg) -> MySQL(mysql2/promise) 전환
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

// pg의 pool.query(text, params) 인터페이스와 비슷하게 쓰기 위한 헬퍼
// mysql2는 결과를 [rows, fields] 형태로 반환하므로 rows만 꺼내서 { rows } 형태로 통일
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return { rows };
}

module.exports = { pool, query };
