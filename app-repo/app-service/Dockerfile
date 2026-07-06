# Dockerfile (repo 루트)
# frontend + backend를 하나의 이미지/컨테이너로 합칩니다.
# - 1단계: frontend(React+Vite) 빌드 -> 정적 파일(dist) 생성
# - 2단계: backend(Express) 의존성 설치
# - 3단계: backend 소스 + frontend 빌드 결과물(dist -> public)을 한 이미지에 담아
#          Express가 정적 파일 서빙 + API(/api/*) + Socket.IO를 모두 처리

FROM node:20-alpine AS frontend-build
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM node:20-alpine AS backend-deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# 컨테이너는 root로 띄우지 않음 (EKS 보안 권고)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=backend-deps /app/node_modules ./node_modules
COPY backend/ .
COPY --from=frontend-build /fe/dist ./public
USER appuser
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/healthz || exit 1
CMD ["node", "src/app.js"]
