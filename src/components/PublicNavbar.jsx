import { Link } from 'react-router-dom';
import { Shield, Database } from 'lucide-react';

export default function PublicNavbar() {
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
            </div>
        </div>
        </nav>
    );
}
