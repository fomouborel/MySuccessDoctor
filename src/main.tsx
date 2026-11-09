import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './app/App';
import { requestPersistence } from './services/db';
import './styles/global.css';

// Application installable et utilisable hors ligne ; mise à jour automatique à chaque déploiement.
registerSW({ immediate: true });
void requestPersistence();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
