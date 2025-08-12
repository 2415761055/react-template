// src/index.tsx (这是它的最终正确形态)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 引入 antd 的全局重置样式，解决空白页问题
import 'antd/dist/reset.css'; 

// 找到 HTML 中的 root 元素，并将我们的 App 组件渲染进去
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);