import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';

/**
 * AdminRoute
 * - Melindungi halaman admin
 * - Jika belum login → redirect ke /login
 * - Session & token dipantau via AuthContext
 */
export default function AdminRoute({ children }) {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
        navigate('/login', { replace: true });
        }
    }, [user, loading, navigate]);

    // Saat cek session atau belum login → jangan render apa pun
    if (loading || !user) return null;

    return children;
}
