// backend/src/services/openemrDirect.js
//
// OpenEMR FHIR API 대신, OpenEMR DB(openemr)에 직접 SQL로 붙어서 동작하는 버전입니다.
//
// ✅ 아래 테이블/컬럼명은 실제 서버(scripts/inspectOpenemrSchema.js 결과)로 검증했습니다.
//    (patient_data, prescriptions, immunizations, procedure_order/report/result,
//     documents, form_vitals, openemr_postcalendar_events 전부 확인 완료 - 2026-07)
//
// ⚠️ 다만 openemr_postcalendar_events는 pc_multiple, pc_gid 처럼 NOT NULL 여부를
// 확인하지 못한 컬럼이 있습니다. INSERT 시 에러가 나면 해당 컬럼도 기본값(0)으로
// 같이 넣어주셔야 할 수 있습니다. 예약 생성/변경/취소부터 먼저 테스트해보세요.

const { openemrQuery } = require('../db/openemrPool');

/* ---------------------------------------------------------------------- */
/* 환자 매칭 / 조회                                                        */
/* ---------------------------------------------------------------------- */

// 이름 + 전화번호로 OpenEMR 환자 자동매칭 후보를 찾습니다.
// (하이픈/공백 차이는 무시하고 비교)
async function findPatientMatches(name, phone) {
  const cleanName = (name || '').replace(/\s+/g, '');
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

  const { rows } = await openemrQuery(
    `SELECT pid, fname, lname, DOB, phone_home, phone_cell
     FROM patient_data
     WHERE REPLACE(CONCAT(fname, lname), ' ', '') = ?
       AND (
         REPLACE(REPLACE(phone_home, '-', ''), ' ', '') = ?
         OR REPLACE(REPLACE(phone_cell, '-', ''), ' ', '') = ?
       )`,
    [cleanName, cleanPhone, cleanPhone]
  );
  return rows;
}

// 이미 입력된 openemr_pid가 실제로 OpenEMR에 존재하는 환자인지 확인 (인증상태확인용)
async function getPatientByPid(pid) {
  const { rows } = await openemrQuery(
    `SELECT pid, fname, lname, DOB, phone_home, phone_cell FROM patient_data WHERE pid=?`,
    [pid]
  );
  return rows[0] || null;
}

/* ---------------------------------------------------------------------- */
/* 조회 (진단서/처방전/검사결과/예방접종/건강검진결과)                        */
/* ---------------------------------------------------------------------- */

async function getPrescriptions(pid) {
  const { rows } = await openemrQuery(
    `SELECT id, drug, quantity, dosage, provider_id, date_added, active, note
     FROM prescriptions WHERE patient_id=? ORDER BY date_added DESC`,
    [pid]
  );
  return rows;
}

async function getImmunizations(pid) {
  const { rows } = await openemrQuery(
    `SELECT id, administered_date, immunization_id, cvx_code, manufacturer, lot_number,
            amount_administered, amount_administered_unit, route, administration_site, note
     FROM immunizations WHERE patient_id=? ORDER BY administered_date DESC`,
    [pid]
  );
  return rows;
}

// 검사(랩) 결과: procedure_order -> procedure_report -> procedure_result 3단 조인
async function getLabResults(pid) {
  const { rows } = await openemrQuery(
    `SELECT
       po.procedure_order_id, po.date_ordered, po.order_status,
       pr.procedure_report_id, pr.date_report, pr.report_status,
       prs.result_code, prs.result_text, prs.units, prs.result_status, prs.abnormal
     FROM procedure_order po
     LEFT JOIN procedure_report pr ON pr.procedure_order_id = po.procedure_order_id
     LEFT JOIN procedure_result prs ON prs.procedure_report_id = pr.procedure_report_id
     WHERE po.patient_id = ?
     ORDER BY po.date_ordered DESC`,
    [pid]
  );
  return rows;
}

// 문서(진단서 등 첨부파일 메타데이터) - documents.foreign_id가 환자 pid를 가리킵니다.
async function getDocuments(pid) {
  const { rows } = await openemrQuery(
    `SELECT id, name, date, mimetype, size
     FROM documents WHERE foreign_id=? ORDER BY date DESC`,
    [pid]
  );
  return rows;
}

// 문서 파일 원본 조회 (다운로드용). 본인 소유(foreign_id=pid) 문서인지 함께 확인합니다.
// - type='blob'이고 document_data가 있으면 DB에 저장된 파일 자체를 바로 서빙할 수 있습니다.
// - type='file_url'/'file_disk' 등 파일서버(디스크)에 저장된 경우는 이 서버에서 직접
//   접근할 방법이 없어(별도 스토리지) null을 반환합니다.
async function getDocumentFile(docId, pid) {
  const { rows } = await openemrQuery(
    `SELECT id, name, mimetype, type, document_data, url
     FROM documents WHERE id=? AND foreign_id=?`,
    [docId, pid]
  );
  return rows[0] || null;
}

// 건강검진결과(활력징후) - form_vitals
async function getVitals(pid) {
  const { rows } = await openemrQuery(
    `SELECT id, date, bps, bpd, weight, height, temperature, pulse, respiration, BMI
     FROM form_vitals WHERE pid=? ORDER BY date DESC`,
    [pid]
  );
  return rows;
}

/* ---------------------------------------------------------------------- */
/* 진료예약 (쓰기) - openemr_postcalendar_events                          */
/* ⚠️ 위험도가 가장 높은 부분입니다. 컬럼명이 다르면 여기서부터 에러가 나므로 */
/*    먼저 scripts/inspectOpenemrSchema.js로 실제 컬럼을 확인해주세요.      */
/* ---------------------------------------------------------------------- */

// 기본 진료과(카테고리)/담당의 ID를 못 정했을 때 쓸 값 (OpenEMR 관리자 화면에서 실제 값 확인 후 조정)
const DEFAULT_CATEGORY_ID = process.env.OPENEMR_DEFAULT_CATID || 9; // OpenEMR 기본 'Office Visit' 카테고리
const DEFAULT_PROVIDER_ID = process.env.OPENEMR_DEFAULT_PROVIDER_ID || 1;

function splitDateTime(iso) {
  // '2026-07-05T09:30:00' -> { date: '2026-07-05', time: '09:30:00' }
  const [date, timePart] = String(iso).split('T');
  const time = (timePart || '00:00:00').slice(0, 8);
  return { date, time };
}

async function createAppointment({ pid, start, end, title, department, providerId }) {
  const { date, time: startTime } = splitDateTime(start);
  const { time: endTime } = splitDateTime(end);
  const durationSec = Math.max(
    60,
    (new Date(end).getTime() - new Date(start).getTime()) / 1000 || 900
  );

  // 실제 스키마 확인 결과 pc_pid, pc_aid는 varchar 컬럼이라 문자열로 명시 변환합니다.
  // pc_multiple, pc_gid는 NOT NULL일 수 있어 안전하게 기본값 0을 같이 넣습니다.
  const { rows: result } = await openemrQuery(
    `INSERT INTO openemr_postcalendar_events
       (pc_catid, pc_aid, pc_pid, pc_title, pc_hometext, pc_eventDate, pc_startTime, pc_endTime,
        pc_duration, pc_apptstatus, pc_multiple, pc_gid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '-', 0, 0)`,
    [
      DEFAULT_CATEGORY_ID,
      String(providerId || DEFAULT_PROVIDER_ID),
      String(pid),
      department || '진료예약',
      title || '',
      date,
      startTime,
      endTime,
      durationSec,
    ]
  );
  return { id: result.insertId, pc_eid: result.insertId };
}

async function updateAppointment(pcEid, { start, end }) {
  const { date, time: startTime } = splitDateTime(start);
  const { time: endTime } = splitDateTime(end);
  await openemrQuery(
    `UPDATE openemr_postcalendar_events
     SET pc_eventDate=?, pc_startTime=?, pc_endTime=?
     WHERE pc_eid=?`,
    [date, startTime, endTime, pcEid]
  );
  return { id: pcEid };
}

async function cancelAppointment(pcEid) {
  // 실제로 행을 지우지 않고 상태만 취소로 변경 (OpenEMR 캘린더 상 이력 보존)
  await openemrQuery(
    `UPDATE openemr_postcalendar_events SET pc_apptstatus='x' WHERE pc_eid=?`,
    [pcEid]
  );
}

module.exports = {
  findPatientMatches,
  getPatientByPid,
  getPrescriptions,
  getImmunizations,
  getLabResults,
  getDocuments,
  getDocumentFile,
  getVitals,
  createAppointment,
  updateAppointment,
  cancelAppointment,
};
