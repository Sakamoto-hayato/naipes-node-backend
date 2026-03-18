#!/bin/bash

# Deploy updated source files to server
# Server: 64.225.63.155
# Password: Akulakk2026@Sakamoto

set -e

SERVER_IP="64.225.63.155"
SERVER_USER="root"
REMOTE_DIR="/var/www/naipes-backend"
LOCAL_DIR="d:/naipes/naipes-backend"

echo "========================================"
echo "Deploying updates to Naipes Backend"
echo "========================================"
echo ""
echo "Server: $SERVER_IP"
echo "Remote directory: $REMOTE_DIR"
echo ""

# Transfer source files
echo "1. Transferring source files..."
scp -o StrictHostKeyChecking=no -r src/ ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/

echo ""
echo "2. Rebuilding on server..."

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    cd /var/www/naipes-backend

    echo "Building TypeScript..."
    npm run build

    echo ""
    echo "Restarting PM2..."
    pm2 restart naipes-backend

    echo ""
    echo "Checking status..."
    pm2 status naipes-backend

    echo ""
    echo "Testing health endpoint..."
    sleep 2
    curl -s http://localhost:3001/health | jq '.' || curl -s http://localhost:3001/health
ENDSSH

echo ""
echo "========================================"
echo "Deployment complete!"
echo "========================================"
echo ""
echo "Backend is running at: http://64.225.63.155:3001"
echo ""
echo "Test with:"
echo "  curl http://64.225.63.155:3001/api/health"
echo ""
