import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

import { QueryProvider } from './context/QueryProvider.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={googleClientId} use_fedcm_for_prompt={true}>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: { borderRadius: '12px', background: '#333', color: '#fff' }
                }}
            />
            <QueryProvider>
                <App />
            </QueryProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>
);
