import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { AuthContext } from './auth.context';

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ambil session pertama
        supabase.auth.getSession().then(({ data }) => {
        setUser(data.session?.user || null);
        setLoading(false);
        });

        // Listener auth (login, logout, refresh token)
        const {
        data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
        {children}
        </AuthContext.Provider>
    );
}
