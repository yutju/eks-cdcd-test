// backend/src/metrics.js
// Prometheus 메트릭 노출용 모듈.
// Argo Rollouts 카나리 분석(AnalysisTemplate)이 이 메트릭(http_requests_total)의
// 5xx 비율을 보고 카나리 승격/중단을 자동 판정한다.
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'HTTP 요청 수 (카나리 성공률 판정 기준 메트릭)',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP 요청 처리 시간(초)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// 라벨 카디널리티 폭발 방지:
// - 매칭된 Express 라우트가 있으면 라우트 패턴(/api/board/:id 형태)을 사용
// - 정적 파일/SPA catch-all은 전부 'static' 하나로 묶음
// - 매칭 안 된 API 요청(404 등)은 'unmatched'로 묶음
function routeLabel(req) {
  if (req.route && req.route.path) {
    return (req.baseUrl || '') + req.route.path;
  }
  return req.path.startsWith('/api') ? 'unmatched' : 'static';
}

// 요청 계측 미들웨어. 프로브/메트릭 트래픽은 제외해서
// 실사용 트래픽만으로 카나리 성공률이 계산되게 함.
const EXCLUDED = new Set(['/metrics', '/healthz', '/readyz']);

function metricsMiddleware(req, res, next) {
  if (EXCLUDED.has(req.path)) return next();
  const endTimer = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: routeLabel(req),
      status_code: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });
  next();
}

async function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

module.exports = { metricsMiddleware, metricsHandler };
