import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Zorg ervoor dat de paden kloppen
import App from './App'; // Zorg ervoor dat de paden kloppen

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);