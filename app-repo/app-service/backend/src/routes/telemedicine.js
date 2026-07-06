// backend/src/routes/telemedicine.js (MySQL 버전)
const express = require('express');
const crypto = require('crypto');
const jwtAuth = require('../middleware/jwtAuth');
const { query } = require('../db/pool');
const router = express.Router();

router.post('/schedule', jwtAuth, async (req, res) => {
  const { appointmentId, scheduledAt } = req.body;
  const roomName = `tele-${crypto.randomUUID()}`;

  const { rows: result } = await query(
    `INSERT INTO telemedicine_session (appointment_id, patient_id, room_name, scheduled_at)
     VALUES (?,?,?,?)`,
    [appointmentId, req.userId, roomName, scheduledAt]
  );
  const { rows } = await query('SELECT * FROM telemedicine_session WHERE id=?', [result.insertId]);
  res.status(201).json(rows[0]);
});

router.get('/my-sessions', jwtAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM telemedicine_session WHERE patient_id=? ORDER BY scheduled_at DESC`, [req.userId]
  );
  res.json(rows);
});

module.exports = router;
