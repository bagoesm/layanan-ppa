// src/pages/AdminLogin.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin({ isAdmin, setIsAdmin }) {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (e.target.password.value === 'admin123') {
      setIsAdmin(true);
      navigate('/admin');
    } else {
      alert('Password salah! Hint: admin123');
    }
  };

  if (isAdmin) {
    // kalau sudah login, langsung ke dashboard
    navigate('/admin');
  }

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow w-full max-w-sm"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          Admin Login
        </h2>
        <input
          type="password"
          name="password"
          placeholder="admin123"
          className="w-full border p-3 rounded mb-4"
        />
        <button className="w-full bg-slate-900 text-white p-3 rounded font-bold">
          Masuk
        </button>
      </form>
    </div>
  );
}
