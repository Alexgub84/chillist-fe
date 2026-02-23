import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import { App } from './App.tsx';

if (import.meta.env.DEV) {
  document.title = `[local] ${document.title}`;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
