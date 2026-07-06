// backend/src/db/openemrPool.js
// 환자포털 DB(patient_portal)와 완전히 별개인 OpenEMR DB(openemr) 전용 커넥션 풀입니다.
// 두 DB가 물리적으로 다른 서버/스키마이므로 pool.js와 분리해서 관리합니다.
const mysql = require('mysql2/promise');

const openemrPool = mysql.createPool({
  host: process.env.OPENEMR_DB_HOST,
  port: process.env.OPENEMR_DB_PORT || 3306,
  user: process.env.OPENEMR_DB_USER,
  password: process.env.OPENEMR_DB_PASSWORD,
  database: process.env.OPENEMR_DB_NAME || 'openemr',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

async function openemrQuery(sql, params = []) {
  const [rows] = await openemrPool.query(sql, params);
  return { rows };
}

module.exports = { openemrPool, openemrQuery };
