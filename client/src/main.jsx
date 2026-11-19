import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './shared/hooks/useAuth.jsx';
import { showErrorToast } from './shared/utils/toast';
import './index.css';

// Screens only catch the API errors they have a specific UI for (e.g.
// QR_NOT_ISSUED); every other failed request surfaces here as a toast rather
// than failing silently. apiClient normalises errors to carry `code`.
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (error?.code) {
    event.preventDefault();
    showErrorToast(error.message);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
