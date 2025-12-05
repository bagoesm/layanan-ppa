// src/App.jsx
// import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate,useLocation, } from 'react-router-dom';
// import { Shield, Database, LogOut } from 'lucide-react';

// import Navbar from './components/Navbar';
import PublicNavbar from './components/PublicNavbar';
import AdminNavbar from './components/AdminNavbar';
import PublicHome from './pages/PublicHome';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ApiDocs from './pages/ApiDocs';
import AdminRoute from './routes/AdminRoute';
import GuestRoute from './routes/GuestRoute';

function Layout() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      {isAdminPage ? <AdminNavbar /> : <PublicNavbar />}

      <Routes>
        <Route path="/" element={<PublicHome />} />
          
        <Route
          path="/login"
          element={
            <GuestRoute>
              <AdminLogin />
            </GuestRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route path="/api" element={<ApiDocs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800 pb-10">
        <Layout />
      </div>
    </BrowserRouter>
  );
}
