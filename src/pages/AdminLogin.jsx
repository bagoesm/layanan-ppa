import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../services/authService';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await loginAdmin(email, password);

      navigate('/admin', { replace: true });

    } catch (err) {
      setErrorMsg(err.message || 'Login gagal');
    }

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

        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 mb-3 rounded text-sm">
            {errorMsg}
          </div>
        )}

        <input
          type="email"
          name="email"
          placeholder="email"
          className="w-full border p-3 rounded mb-3"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="password"
          className="w-full border p-3 rounded mb-4"
          required
        />

        <button
          disabled={loading}
          className="w-full bg-slate-900 text-white p-3 rounded font-bold disabled:opacity-50"
        >
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
