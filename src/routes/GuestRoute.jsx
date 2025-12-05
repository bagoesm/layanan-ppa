import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';

/**
 * GuestRoute
 * - Hanya bisa diakses oleh user BELUM login
 * - Jika sudah login → redirect ke /admin
 */
export default function GuestRoute({ children }) {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
        navigate('/admin', { replace: true });
        }
    }, [user, loading, navigate]);

    // Saat cek session → jangan render apa pun
    if (loading) return null;

    return children;
}
