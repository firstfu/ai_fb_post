module.exports = {
  apps: [
    {
      name: "fastapi-demo",
      cwd: "/www/my_project/ai_fb_post",
      script: "/root/.pyenv/shims/uvicorn",
      // 4 個 worker；自動隨 CPU 數調整時可改成 --workers $(nproc)
      args: "app.main:app --host 0.0.0.0 --port 8000 --reload",
      interpreter: "none",
      exec_mode: "fork", // 仍用 fork
      autorestart: true,
      max_restarts: 5,
      env: {
        PYTHONUNBUFFERED: "1",
        NODE_ENV: "development",
        // NODE_ENV: "production",
      },
    },
  ],
};
