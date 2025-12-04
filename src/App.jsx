// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Shield, Database, LogOut } from 'lucide-react';

import PublicHome from './pages/PublicHome';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ApiDocs from './pages/ApiDocs';

function Navbar({ isAdmin, setIsAdmin }) {
  return (
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="text-rose-500" />
          <span className="font-bold text-lg">LayananPPA</span>
        </Link>

        <div className="flex gap-3 text-sm items-center">
          <Link to="/">Cari</Link>
          <Link to="/api" className="flex gap-1 items-center">
            <Database size={14} /> API
          </Link>

          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className="px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 flex items-center gap-1"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setIsAdmin(false);
                }}
                className="flex gap-1 text-red-300 items-center text-xs"
              >
                <LogOut size={14} /> Exit
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-rose-600 px-3 py-1 rounded text-xs"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800 pb-10">
        <Navbar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />

        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route
            path="/login"
            element={<AdminLogin isAdmin={isAdmin} setIsAdmin={setIsAdmin} />}
          />
          <Route
            path="/admin"
            element={
              isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/api" element={<ApiDocs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
