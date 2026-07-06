// backend/src/routes/admin.js
const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const { query } = require('../db/pool');
const openemr = require('../services/openemrDirect');

const router = express.Router();
router.use(adminAuth);

/* ---------- 환자 실명확인 / OpenEMR 연동 ---------- */

// 환자 목록 조회 (검색 + 인증 상태 필터)
router.get('/patients', async (req, res) => {
  try {
    const { search = '', verified } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(name LIKE ? OR login_id LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (verified === 'true') conditions.push('is_verified = 1');
    if (verified === 'false') conditions.push('is_verified = 0');

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT id, login_id, name, phone, email, openemr_pid, is_verified, created_at
       FROM patients_local ${where} ORDER BY created_at DESC LIMIT 200`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 자동 연동 시도: 이름+전화번호로 OpenEMR patient_data와 매칭
// - 정확히 1건 매칭 -> 자동으로 연동 처리
// - 0건 또는 2건 이상 -> 연동하지 않고 후보 목록만 반환 (관리자가 수동으로 선택/입력)
router.post('/patients/:id/auto-link', async (req, res) => {
  try {
    const { rows } = await query('SELECT name, phone FROM patients_local WHERE id=?', [req.params.id]);
    const patient = rows[0];
    if (!patient) return res.status(404).json({ error: '환자를 찾을 수 없습니다.' });

    const matches = await openemr.findPatientMatches(patient.name, patient.phone);

    if (matches.length === 1) {
      const pid = matches[0].pid;
      await query('UPDATE patients_local SET openemr_pid=?, is_verified=1 WHERE id=?', [pid, req.params.id]);
      return res.json({ status: 'linked', openemrPid: pid, match: matches[0] });
    }
    if (matches.length === 0) {
      return res.json({ status: 'no_match', candidates: [] });
    }
    return res.json({ status: 'ambiguous', candidates: matches });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'OpenEMR DB 조회 중 오류가 발생했습니다.' });
  }
});

// 인증상태확인: 현재 저장된 openemr_pid가 실제 OpenEMR에 존재하는지 검증
router.get('/patients/:id/openemr-status', async (req, res) => {
  try {
    const { rows } = await query('SELECT openemr_pid FROM patients_local WHERE id=?', [req.params.id]);
    const pid = rows[0]?.openemr_pid;
    if (!pid) return res.json({ status: 'unlinked' });

    const emrPatient = await openemr.getPatientByPid(pid);
    if (!emrPatient) return res.json({ status: 'invalid', openemrPid: pid });
    return res.json({ status: 'valid', openemrPid: pid, emrPatient });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'OpenEMR DB 조회 중 오류가 발생했습니다.' });
  }
});

// 실명확인 처리: OpenEMR 환자 ID 연결 + is_verified = 1 (수동 입력)
router.put('/patients/:id/verify', async (req, res) => {
  try {
    const { openemrPid } = req.body;
    if (!openemrPid) {
      return res.status(400).json({ error: 'openemrPid 값이 필요합니다.' });
    }
    await query(
      'UPDATE patients_local SET openemr_pid=?, is_verified=1 WHERE id=?',
      [openemrPid, req.params.id]
    );
    const { rows } = await query(
      'SELECT id, login_id, name, phone, email, openemr_pid, is_verified FROM patients_local WHERE id=?',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 실명확인 취소 (연동 해제)
router.put('/patients/:id/unverify', async (req, res) => {
  try {
    await query(
      'UPDATE patients_local SET openemr_pid=NULL, is_verified=0 WHERE id=?',
      [req.params.id]
    );
    res.json({ message: '인증이 해제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

/* ---------- 게시판(공지/FAQ) 관리 ---------- */

// 전체 게시글 목록 (관리용, 타입 무관하게 최신순)
router.get('/board/:boardType', async (req, res) => {
  try {
    const { boardType } = req.params;
    const { rows } = await query(
      `SELECT p.*, u.name AS author_name FROM board_posts p
       LEFT JOIN patients_local u ON u.id = p.author_id
       WHERE board_type=? ORDER BY is_notice DESC, created_at DESC LIMIT 200`,
      [boardType]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 관리자 글쓰기 (공지 여부 지정 가능)
router.post('/board/:boardType', async (req, res) => {
  try {
    const { boardType } = req.params;
    const { title, content, isNotice } = req.body;
    const { rows: result } = await query(
      `INSERT INTO board_posts (board_type, title, content, author_id, is_notice)
       VALUES (?,?,?,NULL,?)`,
      [boardType, title, content, isNotice ? 1 : 0]
    );
    const { rows } = await query('SELECT * FROM board_posts WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 게시글 삭제 (댓글은 FK ON DELETE CASCADE로 함께 삭제됨)
router.delete('/board/post/:id', async (req, res) => {
  try {
    await query('DELETE FROM board_posts WHERE id=?', [req.params.id]);
    res.json({ message: '삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

/* ---------- 상담(메시지) 관리 ---------- */

// 메시지가 1건이라도 있는 환자 = 상담 스레드 목록 (최근 메시지순)
router.get('/messages', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        p.id AS patient_id, p.name, p.login_id,
        (SELECT sm.content FROM secure_messages sm WHERE sm.patient_id = p.id
           ORDER BY sm.created_at DESC LIMIT 1) AS last_content,
        (SELECT sm.created_at FROM secure_messages sm WHERE sm.patient_id = p.id
           ORDER BY sm.created_at DESC LIMIT 1) AS last_at,
        (SELECT COUNT(*) FROM secure_messages sm WHERE sm.patient_id = p.id
           AND sm.sender_type='patient' AND sm.is_read=0) AS unread_count
      FROM patients_local p
      WHERE EXISTS (SELECT 1 FROM secure_messages sm2 WHERE sm2.patient_id = p.id)
      ORDER BY last_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 특정 환자와의 대화 전체 조회 (환자가 보낸 메시지를 읽음 처리)
router.get('/messages/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    await query(
      `UPDATE secure_messages SET is_read=1 WHERE patient_id=? AND sender_type='patient' AND is_read=0`,
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

// 의료진(관리자) 답장
router.post('/messages/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: '내용을 입력하세요.' });
    }
    const { rows: result } = await query(
      `INSERT INTO secure_messages (thread_id, sender_type, sender_id, patient_id, content)
       VALUES (?, 'staff', ?, ?, ?)`,
      [patientId, req.adminId, patientId, content]
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
