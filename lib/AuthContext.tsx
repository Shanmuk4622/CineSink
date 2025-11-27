import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Profile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  loginWithCredentials: (email: string, pass: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signOut: async () => {},
  loginWithCredentials: async () => null,
});

export const useAuth = () => useContext(AuthContext);

const GHOST_CREDS_KEY = 'cinesync_ghost_creds';
const AVATAR_API = 'https://api.dicebear.com/7.x/avataaars/svg?seed=';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Check existing session
        const { data: { session } } = await supabase.auth.getSession();
        let userId = session?.user?.id;

        // 2. If no session, try Ghost Login/Signup
        if (!userId) {
            // Check LocalStorage for Ghost Creds
            const storedCreds = localStorage.getItem(GHOST_CREDS_KEY);
            
            if (storedCreds) {
                const { email, password } = JSON.parse(storedCreds);
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
                
                if (loginData.session) {
                    userId = loginData.user.id;
                } else {
                    console.warn("Stored ghost creds invalid or expired:", loginError);
                    localStorage.removeItem(GHOST_CREDS_KEY); // Invalid creds, clear them to retry creation
                }
            }

            // If still no user (either no stored creds or they failed), create new Ghost Account
            if (!userId) {
                const ghostSuffix = Math.random().toString(36).substring(2, 8); // Random alphanumeric string
                const timestamp = Date.now();
                // FIX: Use strictly alphanumeric email to bypass strict validators
                const email = `vitap${timestamp}${ghostSuffix}@cinesync.com`;
                const password = `s3curePass_${timestamp}!`;

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) {
                    console.error("Signup Failed:", signUpError);
                    throw signUpError;
                }

                if (signUpData.user) {
                    // CRITICAL CHECK: If user is created but session is null, Email Confirmation is ON.
                    if (!signUpData.session) {
                         throw new Error("ACCOUNT CREATED BUT BLOCKED: Please go to Supabase Dashboard -> Authentication -> Providers -> Email and DISABLE 'Confirm email'.");
                    }

                    userId = signUpData.user.id;
                    localStorage.setItem(GHOST_CREDS_KEY, JSON.stringify({ email, password }));
                } else {
                    throw new Error("Could not initialize secure session. Supabase returned no user.");
                }
            }
        }

        // 3. Ensure Profile Exists
        if (userId) {
            setUser({ id: userId });
            
            // Try fetching profile
            let { data: existingProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (!existingProfile) {
                // Create profile if missing
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const newProfile: Profile = {
                    id: userId,
                    username: `Student ${randomSuffix}`,
                    avatar_url: `${AVATAR_API}${userId}`,
                    watched_count: 0
                };
                
                const { error: insertError } = await supabase.from('profiles').insert(newProfile);
                
                if (!insertError) {
                    existingProfile = newProfile;
                } else {
                    console.error("Profile creation error:", insertError);
                    // If insert failed, it might be because the Trigger from SQL already created it. 
                    // Let's try fetching one more time just in case.
                    const { data: retryProfile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
                    if (retryProfile) existingProfile = retryProfile;
                }
            }
            setProfile(existingProfile);
        }

      } catch (err: any) {
        console.error("Auth Error:", err);
        // Clean error message for UI
        const msg = err.message || "Authentication failed";
        if (msg.includes("email")) {
            setError(msg + " (Check Supabase Auth Settings)");
        } else {
            setError(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signOut = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem(GHOST_CREDS_KEY);
      window.location.reload(); // Force reload to restart auth flow
  };

  const loginWithCredentials = async (email: string, pass: string): Promise<string | null> => {
      const { data, error } = await supabase.auth.signInWithPassword({
          email, password: pass
      });
      
      if (error) return error.message;
      if (data.session) {
          // Update local storage so we persist this user next time
          localStorage.setItem(GHOST_CREDS_KEY, JSON.stringify({ email, password: pass }));
          window.location.reload();
          return null;
      }
      return "Login failed";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signOut, loginWithCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};