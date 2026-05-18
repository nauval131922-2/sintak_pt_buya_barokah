module.exports = {
  apps: [
    {
      name: "sintak-prod",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 0.0.0.0",
      interpreter: "node",
      cwd: "./",
      env: {
        NODE_ENV: "production",
      },
      // Restart otomatis jika crash
      autorestart: true,
      // Jangan restart jika uptime < 10 detik (hindari restart loop)
      min_uptime: "10s",
      max_restarts: 5,
      // Log output
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
