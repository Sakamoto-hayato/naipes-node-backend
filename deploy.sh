#!/bin/bash

# Naipes Backend Deployment Script
# 서버: 64.225.63.155
# 포트: 3001

set -e  # 에러 발생 시 스크립트 중단

echo "========================================="
echo "Naipes Backend Deployment Script"
echo "========================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 서버 정보
SERVER_IP="64.225.63.155"
SERVER_USER="root"
DEPLOY_PATH="/var/www/naipes-backend"
APP_PORT="3001"

# 1. SSH 연결 테스트
echo -e "${YELLOW}1. SSH 연결 테스트...${NC}"
if ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo 'SSH connection successful'"; then
    echo -e "${GREEN}✓ SSH 연결 성공${NC}"
else
    echo -e "${RED}✗ SSH 연결 실패. SSH 키 또는 비밀번호를 확인하세요.${NC}"
    exit 1
fi
echo ""

# 2. 서버 환경 확인
echo -e "${YELLOW}2. 서버 환경 확인...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    echo "Node.js 버전:"
    node --version || echo "Node.js 미설치"

    echo "npm 버전:"
    npm --version || echo "npm 미설치"

    echo "PM2 설치 확인:"
    pm2 --version || echo "PM2 미설치"

    echo "MySQL 상태:"
    systemctl is-active mysql || echo "MySQL 실행 중 아님"

    echo "Redis 상태:"
    systemctl is-active redis-server || echo "Redis 실행 중 아님"
ENDSSH
echo ""

# 3. PHP 백엔드 찾기
echo -e "${YELLOW}3. 기존 PHP 백엔드 확인...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    echo "PHP 프로세스:"
    ps aux | grep php | grep -v grep || echo "PHP 프로세스 없음"

    echo ""
    echo "PHP 파일 위치:"
    find /var/www -name "*.php" -type f 2>/dev/null | head -10 || echo "PHP 파일 없음"
ENDSSH
echo ""

# 4. 배포 디렉토리 생성
echo -e "${YELLOW}4. 배포 디렉토리 준비...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
    # 기존 디렉토리 백업 (있는 경우)
    if [ -d "${DEPLOY_PATH}" ]; then
        echo "기존 디렉토리 발견. 백업 생성..."
        mv ${DEPLOY_PATH} ${DEPLOY_PATH}.backup.\$(date +%Y%m%d_%H%M%S)
    fi

    # 새 디렉토리 생성
    mkdir -p ${DEPLOY_PATH}
    mkdir -p ${DEPLOY_PATH}/logs
    mkdir -p ${DEPLOY_PATH}/uploads

    echo "✓ 디렉토리 생성 완료: ${DEPLOY_PATH}"
ENDSSH
echo ""

# 5. 파일 전송
echo -e "${YELLOW}5. 파일 전송 중...${NC}"
read -p "파일 전송 방법을 선택하세요 (1: rsync, 2: scp, 3: git): " TRANSFER_METHOD

case $TRANSFER_METHOD in
    1)
        echo "rsync로 파일 전송..."
        rsync -avz --exclude 'node_modules' \
                   --exclude '.git' \
                   --exclude 'dist' \
                   --exclude 'logs' \
                   --exclude '.env' \
                   ./ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/
        ;;
    2)
        echo "scp로 파일 전송..."
        scp -r ./* ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/
        ;;
    3)
        echo "Git 저장소 URL을 입력하세요:"
        read GIT_REPO
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${DEPLOY_PATH} && git clone ${GIT_REPO} ."
        ;;
    *)
        echo -e "${RED}잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac
echo -e "${GREEN}✓ 파일 전송 완료${NC}"
echo ""

# 6. 서버에서 빌드 및 설정
echo -e "${YELLOW}6. 서버에서 빌드 및 설정...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
    cd ${DEPLOY_PATH}

    # .env 파일 확인
    if [ ! -f .env ]; then
        echo "⚠ .env 파일이 없습니다. .env.production을 복사합니다."
        cp .env.production .env
        echo "❗ 중요: .env 파일을 수정하여 프로덕션 설정을 완료하세요!"
    fi

    # 의존성 설치
    echo "의존성 설치 중..."
    npm install --production

    # Prisma 클라이언트 생성
    echo "Prisma 클라이언트 생성..."
    npx prisma generate

    # 빌드
    echo "TypeScript 빌드..."
    npm run build

    # 권한 설정
    chmod 600 .env
    chmod -R 755 ${DEPLOY_PATH}

    echo "✓ 빌드 완료"
ENDSSH
echo ""

# 7. 데이터베이스 설정 확인
echo -e "${YELLOW}7. 데이터베이스 마이그레이션...${NC}"
read -p "데이터베이스 마이그레이션을 실행하시겠습니까? (y/n): " RUN_MIGRATION

if [ "$RUN_MIGRATION" = "y" ]; then
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
        cd ${DEPLOY_PATH}
        echo "데이터베이스 마이그레이션 실행..."
        npm run prisma:migrate:prod
        echo "✓ 마이그레이션 완료"
ENDSSH
else
    echo "⚠ 마이그레이션을 건너뜁니다. 나중에 수동으로 실행하세요."
fi
echo ""

# 8. PM2로 애플리케이션 시작
echo -e "${YELLOW}8. PM2로 애플리케이션 시작...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
    cd ${DEPLOY_PATH}

    # 기존 프로세스 중지 (있는 경우)
    pm2 delete naipes-backend 2>/dev/null || echo "기존 프로세스 없음"

    # 새 프로세스 시작
    pm2 start ecosystem.config.js

    # PM2 저장
    pm2 save

    # 상태 확인
    pm2 list

    echo "✓ 애플리케이션 시작 완료"
ENDSSH
echo ""

# 9. 배포 확인
echo -e "${YELLOW}9. 배포 확인...${NC}"
sleep 5  # 애플리케이션 시작 대기

echo "Health check..."
if curl -f http://${SERVER_IP}:${APP_PORT}/health 2>/dev/null; then
    echo -e "${GREEN}✓ Health check 성공!${NC}"
else
    echo -e "${RED}✗ Health check 실패. 로그를 확인하세요.${NC}"
    echo "로그 확인 명령어: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs naipes-backend'"
fi
echo ""

# 10. 요약
echo "========================================="
echo -e "${GREEN}배포 완료!${NC}"
echo "========================================="
echo ""
echo "서버 정보:"
echo "  - IP: ${SERVER_IP}"
echo "  - 포트: ${APP_PORT}"
echo "  - 경로: ${DEPLOY_PATH}"
echo ""
echo "다음 단계:"
echo "  1. .env 파일 수정 (비밀번호, 시크릿 키 등)"
echo "     ssh ${SERVER_USER}@${SERVER_IP} 'nano ${DEPLOY_PATH}/.env'"
echo ""
echo "  2. Nginx 설정 (리버스 프록시)"
echo "     DEPLOYMENT_GUIDE.md의 섹션 9 참조"
echo ""
echo "  3. 로그 확인"
echo "     ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs naipes-backend'"
echo ""
echo "  4. API 테스트"
echo "     curl http://${SERVER_IP}:${APP_PORT}/api/health"
echo ""
echo "========================================="
