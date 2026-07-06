// backend/src/routes/message.js
const express = require('express');
const jwtAuth = require('../middleware/jwtAuth');
const { query } = require('../db/pool');

const router = express.Router();

// 환자 1명 = 상담 스레드 1개 (thread_id = 환자 id)
router.get('/', jwtAuth, async (req, res) => {
  try {
    const patientId = req.userId;
    // 의료진이 보낸 메시지 중 안 읽은 것을 조회 시점에 읽음 처리
    await query(
      `UPDATE secure_messages SET is_read=1 WHERE patient_id=? AND sender_type='staff' AND is_read=0`,
      [patientId]
    );
    const { rows } = await query(
      `SELECT * FROM secure_messages WHERE patient_id=? ORDER BY created_at ASC`,
      [patientId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

router.post('/', jwtAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: '내용을 입력하세요.' });
    }
    const patientId = req.userId;
    const { rows: result } = await query(
      `INSERT INTO secure_messages (thread_id, sender_type, sender_id, patient_id, content)
       VALUES (?, 'patient', ?, ?, ?)`,
      [patientId, patientId, patientId, content]
    );
    const { rows } = await query('SELECT * FROM secure_messages WHERE id=?', [result.insertId]);
    const message = rows[0];

    const io = req.app.get('io');
    if (io) {
      io.to(`thread_${patientId}`).emit('new_message', message);
      io.to('admin_messages').emit('thread_updated', { patientId, message });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
