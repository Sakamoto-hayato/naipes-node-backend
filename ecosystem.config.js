module.exports = {
  apps: [{
    name: 'naipes-backend',
    script: './dist/server.js',

    // 클러스터 모드 (CPU 코어 수에 따라 자동 조정)
    instances: 2,
    exec_mode: 'cluster',

    // 환경 변수
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },

    // 로그 설정
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // 재시작 설정
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],

    // 크래시 방지
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // 프로세스 관리
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true,

    // 환경별 설정
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
