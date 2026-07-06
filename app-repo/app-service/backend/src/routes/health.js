// backend/src/routes/health.js (MySQL 버전)
const express = require('express');
const jwtAuth = require('../middleware/jwtAuth');
const { query } = require('../db/pool');
const router = express.Router();

router.post('/log', jwtAuth, async (req, res) => {
  const { logType, value1, value2, memo, measuredAt } = req.body;
  const { rows: insertResult } = await query(
    `INSERT INTO health_log (patient_id, log_type, value_1, value_2, memo, measured_at)
     VALUES (?,?,?,?,?,?)`,
    [req.userId, logType, value1, value2, memo, measuredAt]
  );
  // MySQL은 RETURNING이 없으므로 insertId로 재조회
  const insertId = insertResult.insertId;
  const { rows } = await query('SELECT * FROM health_log WHERE id=?', [insertId]);
  res.status(201).json(rows[0]);
});

router.get('/log/:type', jwtAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM health_log WHERE patient_id=? AND log_type=? ORDER BY measured_at DESC LIMIT 90`,
    [req.userId, req.params.type]
  );
  res.json(rows);
});

router.delete('/log/:id', jwtAuth, async (req, res) => {
  await query('DELETE FROM health_log WHERE id=? AND patient_id=?', [req.params.id, req.userId]);
  res.json({ message: '삭제되었습니다.' });
});

module.exports = router;
