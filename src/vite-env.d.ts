/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  // 在这里可以添加更多您在 .env 文件或 Vercel 中定义的其他 VITE_ 开头的环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}