// src/main.tsx
import 'bootstrap/dist/css/bootstrap.min.css';  // ① Bootstrap CSS
import '@fullcalendar/common/main.css';
import 'bootstrap';
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);
