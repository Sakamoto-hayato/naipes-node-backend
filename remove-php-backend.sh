#!/bin/bash

# PHP 백엔드 제거 스크립트
# 서버: 64.225.63.155
# 주의: NestJS 백엔드는 유지됩니다!

set -e

echo "========================================="
echo "PHP 백엔드 제거 스크립트"
echo "========================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVER_IP="64.225.63.155"
SERVER_USER="root"

echo -e "${RED}⚠️  경고: 이 스크립트는 PHP 백엔드를 삭제합니다!${NC}"
echo -e "${YELLOW}NestJS 백엔드는 유지됩니다.${NC}"
echo ""
read -p "계속하시겠습니까? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "작업을 취소했습니다."
    exit 0
fi

echo ""
echo -e "${YELLOW}1. 서버 접속 및 PHP 백엔드 확인...${NC}"

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    echo "========================================="
    echo "현재 실행 중인 프로세스"
    echo "========================================="
    pm2 list 2>/dev/null || echo "PM2 프로세스 없음"
    echo ""

    echo "========================================="
    echo "PHP 프로세스 확인"
    echo "========================================="
    ps aux | grep php | grep -v grep || echo "PHP 프로세스 없음"
    echo ""

    echo "========================================="
    echo "웹 디렉토리 구조"
    echo "========================================="
    ls -la /var/www/ 2>/dev/null || echo "/var/www 디렉토리 없음"
    echo ""

    echo "========================================="
    echo "PHP 파일 검색"
    echo "========================================="
    echo "PHP 파일 위치:"
    find /var/www -name "*.php" -type f 2>/dev/null | head -20 || echo "PHP 파일 없음"
    echo ""

    echo "========================================="
    echo "Nginx 설정 확인"
    echo "========================================="
    echo "활성화된 사이트:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "Nginx sites-enabled 없음"
    echo ""

    # PHP 관련 Nginx 설정 찾기
    echo "PHP 관련 Nginx 설정:"
    grep -r "\.php" /etc/nginx/sites-enabled/ 2>/dev/null || echo "PHP 관련 Nginx 설정 없음"
ENDSSH

echo ""
echo -e "${YELLOW}2. 제거할 PHP 백엔드 디렉토리를 입력하세요${NC}"
echo "예: /var/www/php-backend 또는 /var/www/html/api"
read -p "디렉토리 경로: " PHP_DIR

if [ -z "$PHP_DIR" ]; then
    echo -e "${RED}디렉토리 경로가 입력되지 않았습니다.${NC}"
    exit 1
fi

echo ""
echo -e "${RED}다음 디렉토리를 삭제합니다: ${PHP_DIR}${NC}"
read -p "정말로 삭제하시겠습니까? (yes/no): " FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "yes" ]; then
    echo "작업을 취소했습니다."
    exit 0
fi

echo ""
echo -e "${YELLOW}3. PHP 백엔드 백업 생성...${NC}"

ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
    if [ -d "${PHP_DIR}" ]; then
        BACKUP_DIR="${PHP_DIR}.backup.\$(date +%Y%m%d_%H%M%S)"
        echo "백업 생성 중: \${BACKUP_DIR}"
        cp -r ${PHP_DIR} \${BACKUP_DIR}
        echo "✓ 백업 완료: \${BACKUP_DIR}"
    else
        echo "⚠️  디렉토리가 존재하지 않습니다: ${PHP_DIR}"
        exit 1
    fi
ENDSSH

echo ""
echo -e "${YELLOW}4. PHP 프로세스 중지...${NC}"

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    # PHP-FPM 중지 (있는 경우)
    if systemctl is-active --quiet php7.4-fpm 2>/dev/null; then
        echo "PHP 7.4 FPM 중지..."
        systemctl stop php7.4-fpm
    fi

    if systemctl is-active --quiet php8.0-fpm 2>/dev/null; then
        echo "PHP 8.0 FPM 중지..."
        systemctl stop php8.0-fpm
    fi

    if systemctl is-active --quiet php8.1-fpm 2>/dev/null; then
        echo "PHP 8.1 FPM 중지..."
        systemctl stop php8.1-fpm
    fi

    if systemctl is-active --quiet php8.2-fpm 2>/dev/null; then
        echo "PHP 8.2 FPM 중지..."
        systemctl stop php8.2-fpm
    fi

    # Apache 중지 (있는 경우)
    if systemctl is-active --quiet apache2 2>/dev/null; then
        echo "Apache 중지..."
        systemctl stop apache2
    fi

    echo "✓ PHP 프로세스 중지 완료"
ENDSSH

echo ""
echo -e "${YELLOW}5. PHP 백엔드 디렉토리 삭제...${NC}"

ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
    if [ -d "${PHP_DIR}" ]; then
        echo "삭제 중: ${PHP_DIR}"
        rm -rf ${PHP_DIR}
        echo "✓ 삭제 완료"
    else
        echo "⚠️  디렉토리가 이미 삭제되었거나 존재하지 않습니다."
    fi
ENDSSH

echo ""
echo -e "${YELLOW}6. PHP 관련 Nginx 설정 확인...${NC}"
echo "다음 파일들을 수동으로 확인하고 필요시 수정하세요:"

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    # PHP 관련 Nginx 설정 파일 찾기
    echo "PHP 관련 Nginx 설정 파일:"
    grep -rl "\.php" /etc/nginx/sites-available/ 2>/dev/null || echo "없음"
ENDSSH

echo ""
echo -e "${YELLOW}7. 정리 완료 확인...${NC}"

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    echo "========================================="
    echo "현재 실행 중인 프로세스"
    echo "========================================="
    pm2 list 2>/dev/null || echo "PM2 프로세스 없음"
    echo ""

    echo "========================================="
    echo "웹 디렉토리 구조"
    echo "========================================="
    ls -la /var/www/
    echo ""

    echo "========================================="
    echo "NestJS 백엔드 확인"
    echo "========================================="
    find /var/www -name "nest-cli.json" -o -name "main.ts" 2>/dev/null || echo "NestJS 백엔드 파일 없음"
ENDSSH

echo ""
echo "========================================="
echo -e "${GREEN}PHP 백엔드 제거 완료!${NC}"
echo "========================================="
echo ""
echo "다음 단계:"
echo "  1. Nginx 설정 파일 정리 (필요시)"
echo "     ssh ${SERVER_USER}@${SERVER_IP}"
echo "     sudo nano /etc/nginx/sites-available/default"
echo ""
echo "  2. Nginx 재시작"
echo "     ssh ${SERVER_USER}@${SERVER_IP} 'sudo systemctl restart nginx'"
echo ""
echo "  3. 백업 위치 확인"
echo "     백업은 원본 디렉토리 옆에 .backup.날짜시간 형식으로 저장되었습니다."
echo ""
echo "  4. Node.js 백엔드 배포"
echo "     ./deploy.sh 스크립트를 실행하세요."
echo ""
echo "========================================="
