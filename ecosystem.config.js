// PM2 process configuration for AR Digital Ad Studio
// Usage on production server:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup   (then run the command it prints to make PM2 start on reboot)

module.exports = {
  apps: [
    {
      name: 'ar-digital',
      script: 'server.js',
      cwd: '/home/gmnfnice/repositories/ar-digital-ad-studio',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // Set WEBHOOK_SECRET on the server — do NOT put the real value here
        // Run:  pm2 set ar-digital WEBHOOK_SECRET your_secret_here
        // Or set it as a system env var before running pm2 start
      },
      error_file: '/home/gmnfnice/logs/ar-digital-error.log',
      out_file:   '/home/gmnfnice/logs/ar-digital-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
