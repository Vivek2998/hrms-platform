import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// driver.js CSS must be imported before globals.css so our theme overrides
// win naturally through cascade source order — no !important required.
import 'driver.js/dist/driver.css';
import './styles/globals.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found in DOM');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
