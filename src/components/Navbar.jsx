import { Link, useNavigate } from "react-router-dom";
import { Shield, Database, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Navbar() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
        setUser(data?.user || null);
        });

        const {
        data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
    }

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

            {user ? (
                <>
                <Link
                    to="/admin"
                    className="px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600"
                >
                    Dashboard
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex gap-1 text-red-300 items-center text-xs"
                >
                    <LogOut size={14} /> Logout
                </button>
                </>
            ) : (
                <Link to="/login" className="bg-rose-600 px-3 py-1 rounded text-xs">
                Admin
                </Link>
            )}
            </div>
        </div>
        </nav>
    );
}
