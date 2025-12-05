import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function AdminNavbar() {
    const navigate = useNavigate();

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    }

    return (
        <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow">
        <div className="container mx-auto flex justify-between items-center">
            <Link to="/admin" className="flex items-center gap-2">
            <Shield className="text-emerald-400" />
            <span className="font-bold text-lg">Admin Layanan</span>
            </Link>

            <button
            onClick={handleLogout}
            className="flex gap-1 text-red-300 items-center text-xs"
            >
            <LogOut size={14} /> Logout
            </button>
        </div>
        </nav>
    );
}
