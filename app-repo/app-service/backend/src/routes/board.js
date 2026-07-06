// backend/src/routes/board.js (MySQL 버전)
const express = require('express');
const jwtAuth = require('../middleware/jwtAuth');
const { query } = require('../db/pool');
const router = express.Router();

router.get('/:boardType', async (req, res) => {
  const { boardType } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const { rows } = await query(
    `SELECT p.*, u.name AS author_name FROM board_posts p
     LEFT JOIN patients_local u ON u.id = p.author_id
     WHERE board_type=? ORDER BY is_notice DESC, created_at DESC
     LIMIT ? OFFSET ?`,
    [boardType, limit, (page - 1) * limit]
  );
  res.json(rows);
});

router.post('/:boardType', jwtAuth, async (req, res) => {
  const { boardType } = req.params;
  const { title, content, isPrivate } = req.body;
  const { rows: result } = await query(
    `INSERT INTO board_posts (board_type, title, content, author_id, is_private)
     VALUES (?,?,?,?,?)`,
    [boardType, title, content, req.userId, isPrivate ? 1 : 0]
  );
  const { rows } = await query('SELECT * FROM board_posts WHERE id=?', [result.insertId]);
  res.status(201).json(rows[0]);
});

router.get('/post/:id', async (req, res) => {
  await query('UPDATE board_posts SET view_count = view_count + 1 WHERE id=?', [req.params.id]);
  const post = await query('SELECT * FROM board_posts WHERE id=?', [req.params.id]);
  const comments = await query(
    `SELECT c.*, u.name FROM board_comments c LEFT JOIN patients_local u ON u.id=c.author_id
     WHERE post_id=? ORDER BY created_at`, [req.params.id]
  );
  res.json({ post: post.rows[0], comments: comments.rows });
});

router.post('/post/:id/comment', jwtAuth, async (req, res) => {
  const { rows: result } = await query(
    `INSERT INTO board_comments (post_id, author_id, content) VALUES (?,?,?)`,
    [req.params.id, req.userId, req.body.content]
  );
  const { rows } = await query('SELECT * FROM board_comments WHERE id=?', [result.insertId]);
  res.status(201).json(rows[0]);
});

module.exports = router;
