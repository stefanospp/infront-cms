module.exports = {
  apps: [
    {
      name: 'agency-admin',
      script: './sites/admin/dist/server/entry.mjs',
      cwd: '/opt/infront-cms',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 4320,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
