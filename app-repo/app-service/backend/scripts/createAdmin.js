// backend/scripts/createAdmin.js
// 관리자 계정을 생성하는 1회성 CLI 스크립트입니다.
//
// 사용법 (backend 컨테이너 안에서):
//   node scripts/createAdmin.js <아이디> <비밀번호> <이름>
//
// 예:
//   docker exec -it portal-backend node scripts/createAdmin.js admin "StrongPass!23" "관리자"

// backend 컨테이너는 docker-compose의 env_file로 이미 DB_HOST 등 환경변수가 설정되어
// 있으므로 별도 .env 로딩 없이 process.env를 그대로 사용합니다.
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { query, pool } = require('../src/db/pool');

async function main() {
  const [loginId, password, name] = process.argv.slice(2);
  if (!loginId || !password || !name) {
    console.error('사용법: node scripts/createAdmin.js <아이디> <비밀번호> <이름>');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const id = uuidv4();

  try {
    await query(
      'INSERT INTO admin_users (id, login_id, password_hash, name) VALUES (?,?,?,?)',
      [id, loginId, hash, name]
    );
    console.log(`관리자 계정이 생성되었습니다. (loginId=${loginId})`);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.error('이미 존재하는 아이디입니다.');
    } else {
      console.error('생성 실패:', err.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
