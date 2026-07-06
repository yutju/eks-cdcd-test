// backend/src/routes/appointment.js
// OpenEMR FHIR API 대신 OpenEMR DB(openemr_postcalendar_events)에 직접 쓰는 버전입니다.
const express = require('express');
const jwtAuth = require('../middleware/jwtAuth');
const openemr = require('../services/openemrDirect');
const { query } = require('../db/pool');
const { sendSMS } = require('../services/notifyService');

const router = express.Router();

// JS의 toISOString() 결과('2026-07-22T15:47:00.000Z')는 MySQL DATETIME이 못 읽는 형식이라
// 'T'/'Z'/밀리초를 제거해서 MySQL이 이해하는 형식('2026-07-22 15:47:00')으로 변환합니다.
function toMysqlDatetime(iso) {
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

router.post('/book', jwtAuth, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT openemr_pid, phone, email, name FROM patients_local WHERE id=?', [req.userId]
    );
    const patient = rows[0];
    if (!patient?.openemr_pid) return res.status(400).json({ error: '본인확인이 필요합니다.' });

    const result = await openemr.createAppointment({
      pid: patient.openemr_pid,
      start: req.body.start,
      end: req.body.end,
      title: req.body.reason,
      department: req.body.department,
    });

    await query(
      `INSERT INTO appointment_local
         (patient_id, openemr_appt_id, status, start_time, end_time, department, is_telemedicine)
       VALUES (?,?,?,?,?,?,?)`,
      [req.userId, result.id, 'proposed', toMysqlDatetime(req.body.start), toMysqlDatetime(req.body.end), req.body.department, req.body.isTelemedicine ? 1 : 0]
    );

    await sendSMS(patient.phone, `[병원] ${patient.name}님, ${req.body.start} 진료예약이 접수되었습니다.`);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: '예약 처리 중 오류가 발생했습니다. (OpenEMR DB 스키마를 확인해주세요)' });
  }
});

router.put('/:apptId', jwtAuth, async (req, res) => {
  try {
    const { apptId } = req.params;
    const result = await openemr.updateAppointment(apptId, {
      start: req.body.start,
      end: req.body.end,
    });
    await query(
      `UPDATE appointment_local SET start_time=?, end_time=?, updated_at=CURRENT_TIMESTAMP WHERE openemr_appt_id=?`,
      [toMysqlDatetime(req.body.start), toMysqlDatetime(req.body.end), apptId]
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: '예약 변경 중 오류가 발생했습니다. (OpenEMR DB 스키마를 확인해주세요)' });
  }
});

router.delete('/:apptId', jwtAuth, async (req, res) => {
  try {
    const { apptId } = req.params;
    await openemr.cancelAppointment(apptId);
    await query(
      `UPDATE appointment_local SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE openemr_appt_id=?`,
      [apptId]
    );
    res.json({ message: '예약이 취소되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: '예약 취소 중 오류가 발생했습니다. (OpenEMR DB 스키마를 확인해주세요)' });
  }
});

router.get('/my', jwtAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM appointment_local WHERE patient_id=? ORDER BY start_time DESC`, [req.userId]
  );
  res.json(rows);
});

module.exports = router;
