
import React from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import MainInterface from './pages/MainInterface';
import ProtectedRoute from './components/ProtectedRoute';
function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainInterface />} />
     </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;