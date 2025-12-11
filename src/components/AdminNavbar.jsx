import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Settings, Key, LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useState, useRef, useEffect } from 'react';

export default function AdminNavbar() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    }

    // close dropdown if click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/admin" className="flex items-center gap-2">
                    <Shield className="text-emerald-400" />
                    <span className="font-bold text-lg">Admin Layanan</span>
                </Link>

                {/* PROFILE DROPDOWN */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2 text-sm hover:text-emerald-400"
                    >
                        <User size={16} />
                        Admin
                        <ChevronDown size={14} />
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-3 w-48 bg-white text-slate-800 rounded-lg shadow-lg overflow-hidden">
                            <button
                                onClick={() => navigate('/admin/profile')}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-100 text-sm"
                            >
                                <User size={14} /> Profil Saya
                            </button>

                            <button
                                onClick={() => navigate('/admin/change-password')}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-100 text-sm"
                            >
                                <Key size={14} /> Ubah Password
                            </button>

                            <button
                                onClick={() => navigate('/admin/settings')}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-100 text-sm"
                            >
                                <Settings size={14} /> Pengaturan
                            </button>

                            <div className="border-t my-1" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-sm"
                            >
                                <LogOut size={14} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
