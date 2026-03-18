#!/bin/bash

# API 테스트 스크립트
SERVER="64.225.63.155:3001"

echo "========================================="
echo "Naipes Backend API 테스트"
echo "========================================="
echo ""

echo "1. Health Check"
curl -s http://$SERVER/health | json_pp || curl -s http://$SERVER/health
echo ""
echo ""

echo "2. API Info"
curl -s http://$SERVER/api | json_pp || curl -s http://$SERVER/api
echo ""
echo ""

echo "3. 회원가입 테스트"
curl -s -X POST http://$SERVER/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@naipes.com",
    "username": "testuser",
    "password": "Test123456!",
    "firstName": "Test",
    "lastName": "User"
  }' | json_pp || curl -s -X POST http://$SERVER/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@naipes.com",
    "username": "testuser",
    "password": "Test123456!",
    "firstName": "Test",
    "lastName": "User"
  }'
echo ""
echo ""

echo "4. 로그인 테스트"
LOGIN_RESPONSE=$(curl -s -X POST http://$SERVER/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@naipes.com",
    "password": "Test123456!"
  }')

echo "$LOGIN_RESPONSE" | json_pp 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""
echo ""

# JWT 토큰 추출
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ ! -z "$ACCESS_TOKEN" ]; then
  echo "5. 사용자 정보 조회 테스트 (JWT 인증)"
  curl -s -X GET http://$SERVER/api/auth/me \
    -H "Authorization: Bearer $ACCESS_TOKEN" | json_pp || curl -s -X GET http://$SERVER/api/auth/me \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  echo ""
else
  echo "로그인 실패 - 토큰을 받지 못했습니다."
fi

echo ""
echo "========================================="
echo "테스트 완료!"
echo "========================================="
