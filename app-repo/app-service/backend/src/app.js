// backend/src/app.js
// 단일 컨테이너 구조: Express가 API(/api/*)와 프론트엔드 정적 파일(React 빌드 결과물)을
// 같은 포트(4000)에서 함께 서빙합니다. (nginx 없음, 컨테이너 1개)
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointment');
const medicalRoutes = require('./routes/medical');
const healthRoutes = require('./routes/health');
const boardRoutes = require('./routes/board');
const telemedicineRoutes = require('./routes/telemedicine');
const messageRoutes = require('./routes/message');
require('./jobs/appointmentReminder');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// EKS/ECS liveness/readiness probe용 헬스체크 엔드포인트
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/readyz', (req, res) => res.status(200).json({ status: 'ready' }));

// 프론트엔드(React)가 같은 서버에서 서빙되므로, API는 전부 /api 아래로 모아서
// 프론트 페이지 경로(/health, /board, /medical 등)와 절대 겹치지 않게 합니다.
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/telemedicine', telemedicineRoutes);
app.use('/api/message', messageRoutes);

// 프론트엔드 빌드 결과물 (Dockerfile에서 ./public 으로 복사해 둠)
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// 그 외 모든 GET 요청(React Router 클라이언트 사이드 라우팅용)은 index.html로
// 예: /staff/login, /medical, /board 등을 주소창에 직접 치거나 새로고침해도 정상 동작
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.FRONTEND_URL || '*' } });

// 라우트 핸들러에서 req.app.get('io')로 접근해서 실시간 알림을 보낼 수 있게 등록
app.set('io', io);

// 환자 토큰(role:'patient')과 관리자 토큰(role:'admin') 둘 다 접속 가능하게 인증
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.sub;
    socket.role = payload.role || 'patient';
    next();
  } catch {
    next(new Error('인증 실패'));
  }
});

io.on('connection', (socket) => {
  if (socket.role === 'admin') {
    // 관리자는 전체 상담 목록 갱신 알림을 받는 방에 들어감
    socket.join('admin_messages');
    // 관리자가 특정 환자와의 대화창을 열면 그 스레드 방에도 들어가서 실시간 수신
    socket.on('watch_thread', (patientId) => {
      if (patientId) socket.join(`thread_${patientId}`);
    });
  } else {
    // 환자는 자기 자신의 상담 스레드 방에 들어감
    socket.join(`thread_${socket.userId}`);
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Patient portal API listening on ${PORT}`));

module.exports = { app, server };
