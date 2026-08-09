'use client'

import { createClient } from '@/utils/supabase/client'

export default function LoginButton() {
    const handleLogin = async () => {
        const supabase = createClient()

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error('Google login error:', error)
        }
    }

    return (
        <button onClick={handleLogin}>
            Sign in with Google
        </button>
    )
}