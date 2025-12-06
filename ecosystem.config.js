module.exports = {
  apps: [{
    name: 'fabtech-crm-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5001,
      PRODUCTION_DOMAIN: 'shivshambhuvivah.com',
      FRONTEND_URL: 'https://shivshambhuvivah.com'
    }
  }]
};
