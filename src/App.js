
import React from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import MainInterface from './pages/MainInterface';
import ProtectedRoute from './components/ProtectedRoute';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
function App() {
  return (
    <Routes>
    <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainInterface />} />
    </Route>
    <Route path="/terms" element={<TermsOfUse />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;