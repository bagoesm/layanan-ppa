import { supabase } from '../supabaseClient';

/**
 * Login admin (SEKARANG: Supabase)
 * NANTI: ganti implementasi ke fetch Laravel API
 */
export async function loginAdmin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Ambil user login
 */
export async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user;
}

/**
 * Logout
 */
export async function logout() {
    await supabase.auth.signOut();
}
