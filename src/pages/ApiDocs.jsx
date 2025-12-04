// src/pages/ApiDocs.jsx
import React from 'react';
import { supabaseUrl, supabaseAnonKey } from '../supabaseClient';

export default function ApiDocs() {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Public API Docs</h2>
      <div className="bg-slate-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
        GET {supabaseUrl}/rest/v1/services?select=*&status=eq.Verified
      </div>
      <p className="mt-2 text-sm">
        Header: <code>apikey: {supabaseAnonKey}</code>
      </p>
    </div>
  );
}
