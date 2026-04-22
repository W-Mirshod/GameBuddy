import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div style={{ color: 'white' }}>GG Arena</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

