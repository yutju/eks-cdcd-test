// backend/src/routes/auth.js  (MySQL 버전: ?placeholder, RETURNING 제거)
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { loginId, password, name, phone, email } = req.body;
  try {
    const id = uuidv4(); // MySQL은 UUID() 기본값도 가능하지만, 앱에서 직접 생성해 응답에 바로 사용
    const hash = await bcrypt.hash(password, 12);

    await query(
      `INSERT INTO patients_local (id, login_id, password_hash, name, phone, email)
       VALUES (?,?,?,?,?,?)`,
      [id, loginId, hash, name, phone, email]
    );
    res.status(201).json({ id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: '이미 사용중인 아이디입니다.' });
    }
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

router.post('/login', async (req, res) => {
  const { loginId, password } = req.body;
  const { rows } = await query('SELECT * FROM patients_local WHERE login_id=?', [loginId]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  const token = jwt.sign({ sub: user.id, role: 'patient' }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, name: user.name });
});

module.exports = router;
