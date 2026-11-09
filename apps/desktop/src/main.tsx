import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './lib/theme.js';
import { OnlineProvider } from './lib/api.js';
import './index.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Unable to find the #root element');
}

createRoot(container).render(
  <ThemeProvider>
    <OnlineProvider>
      <App />
    </OnlineProvider>
  </ThemeProvider>
);
