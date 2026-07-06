// backend/scripts/inspectOpenemrSchema.js
//
// 저희가 openemrDirect.js에서 가정하고 있는 테이블/컬럼이 실제 OpenEMR DB와
// 일치하는지 확인하는 스크립트입니다. 적용 전에 꼭 한 번 돌려보세요.
//
// 사용법 (backend 컨테이너 안에서):
//   docker exec -it portal-backend node scripts/inspectOpenemrSchema.js

const { openemrPool } = require('../src/db/openemrPool');

const TABLES = [
  'patient_data',
  'prescriptions',
  'immunizations',
  'procedure_order',
  'procedure_report',
  'procedure_result',
  'documents',
  'form_vitals',
  'openemr_postcalendar_events',
];

async function main() {
  for (const table of TABLES) {
    console.log(`\n=== ${table} ===`);
    try {
      const [rows] = await openemrPool.query(`DESCRIBE \`${table}\``);
      rows.forEach(r => console.log(`  ${r.Field.padEnd(24)} ${r.Type}`));
    } catch (err) {
      console.log(`  ❌ 조회 실패: ${err.message}`);
    }
  }
  await openemrPool.end();
}

main();
