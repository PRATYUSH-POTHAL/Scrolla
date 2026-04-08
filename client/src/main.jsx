import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 3000,
                style: { borderRadius: '12px', background: '#333', color: '#fff' }
            }}
        />
        <App />
    </React.StrictMode>
);
