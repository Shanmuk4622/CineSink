import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getMovieById } from '../services/tmdbService';
import { Movie } from '../types';
import { Film, Clock, User, LogOut, CheckCircle, Key, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import MovieCard from '../components/MovieCard';

const Profile: React.FC = () => {
    const { user, profile, loading: authLoading, signOut, loginWithCredentials } = useAuth();
    
    // Tabs state
    const [activeTab, setActiveTab] = useState<'watchlist' | 'watched'>('watchlist');
    
    // Movies state
    const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
    const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
    const [loadingMovies, setLoadingMovies] = useState(false);
    
    // Stats
    const [watchedCount, setWatchedCount] = useState(0);

    // Account Recovery UI
    const [showCreds, setShowCreds] = useState(false);
    const [creds, setCreds] = useState<{email: string, pass: string} | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('cinesync_ghost_creds');
        if (stored) {
            setCreds(JSON.parse(stored));
        }
    }, []);

    const loadLibrary = async () => {
        if (!user) return;
        setLoadingMovies(true);
        try {
            // Fetch All Library items
            const { data: libraryData } = await supabase
                .from('user_library')
                .select('movie_id, status')
                .eq('user_id', user.id);
            
            if (libraryData && libraryData.length > 0) {
                // Separate IDs
                const watchlistIds = libraryData.filter(i => i.status === 'watchlist').map(i => i.movie_id);
                const watchedIds = libraryData.filter(i => i.status === 'watched').map(i => i.movie_id);
                
                setWatchedCount(watchedIds.length);

                // Fetch details in parallel (unique IDs to save bandwidth)
                const allIds = Array.from(new Set([...watchlistIds, ...watchedIds]));
                const moviePromises = allIds.map(id => getMovieById(id));
                const allMovies = (await Promise.all(moviePromises)).filter((m): m is Movie => m !== null);
                
                setWatchlistMovies(allMovies.filter(m => watchlistIds.includes(m.id)));
                setWatchedMovies(allMovies.filter(m => watchedIds.includes(m.id)));
            } else {
                setWatchlistMovies([]);
                setWatchedMovies([]);
                setWatchedCount(0);
            }

        } catch (error) {
            console.error("Error loading profile movies:", error);
        } finally {
            setLoadingMovies(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadLibrary();
        }
    }, [user]);

    const handleRemove = async (id: number) => {
        if (!user) return;
        
        // Optimistic Update
        if (activeTab === 'watchlist') {
            setWatchlistMovies(prev => prev.filter(m => m.id !== id));
        } else {
            setWatchedMovies(prev => prev.filter(m => m.id !== id));
            setWatchedCount(prev => Math.max(0, prev - 1));
        }

        const { error } = await supabase
            .from('user_library')
            .delete()
            .eq('user_id', user.id)
            .eq('movie_id', id);

        if (error) {
            console.error("Error removing movie:", error);
            // In a real app, revert here
        }
    };

    const handleMarkWatched = async (id: number) => {
        if (!user) return;

        // Find the movie
        const movie = watchlistMovies.find(m => m.id === id);
        if (!movie) return;

        // Optimistic Update: Move from Watchlist to Watched
        setWatchlistMovies(prev => prev.filter(m => m.id !== id));
        setWatchedMovies(prev => [movie, ...prev]);
        setWatchedCount(prev => prev + 1);

        // Update DB
        const { error } = await supabase
            .from('user_library')
            .update({ status: 'watched' })
            .eq('user_id', user.id)
            .eq('movie_id', id);
            
        if (error) console.error("Error marking watched:", error);
        
        // Also update profile count cache if needed
        await supabase.from('profiles').update({ watched_count: watchedCount + 1 }).eq('id', user.id);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true);
        const err = await loginWithCredentials(loginEmail, loginPass);
        if (err) {
            setLoginError(err);
            setIsLoggingIn(false);
        }
        // If success, page reloads automatically
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-400">
                Loading profile data...
            </div>
        );
    }

    if (!profile) {
        return (
             <div className="min-h-screen flex items-center justify-center text-slate-400">
                Establishing secure connection...
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-20">
            {/* Header Card */}
            <div className="bg-slate-800 rounded-2xl p-6 md:p-10 border border-slate-700 flex flex-col md:flex-row items-center gap-8 shadow-xl relative mb-8">
                <button 
                  onClick={signOut}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-full transition-colors"
                  title="Sign Out / Reset Account"
                >
                    <LogOut size={20} />
                </button>

                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-indigo-600 bg-slate-900 shadow-lg">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User size={40} className="text-slate-500" />
                        </div>
                    )}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-white tracking-tight">{profile.username}</h1>
                    <p className="text-slate-400 mt-2 flex items-center justify-center md:justify-start gap-2 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> Online
                    </p>
                    
                    <div className="flex gap-4 mt-6 justify-center md:justify-start">
                        <div className="text-center px-5 py-3 bg-slate-900 rounded-xl border border-slate-700 shadow-sm">
                            <div className="text-2xl font-bold text-indigo-400">{watchedCount}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Watched</div>
                        </div>
                        <div className="text-center px-5 py-3 bg-slate-900 rounded-xl border border-slate-700 shadow-sm">
                            <div className="text-2xl font-bold text-yellow-400">{watchlistMovies.length}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Watchlist</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Recovery & Login Section */}
            <div className="mb-8 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-indigo-900/30 rounded-lg text-indigo-400">
                             <Key size={20} />
                         </div>
                         <div>
                             <h3 className="text-sm font-bold text-white">Account Recovery</h3>
                             <p className="text-xs text-slate-400">Save these credentials to login on other devices.</p>
                         </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowLogin(!showLogin)} 
                            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                        >
                            {showLogin ? "Cancel Switch" : "Switch Account"}
                        </button>
                        <button 
                            onClick={() => setShowCreds(!showCreds)} 
                            className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            {showCreds ? <EyeOff size={14}/> : <Eye size={14}/>}
                            {showCreds ? "Hide" : "Reveal Credentials"}
                        </button>
                    </div>
                </div>
                
                {/* Credentials Display */}
                {showCreds && creds && (
                    <div className="mt-4 p-4 bg-black/40 rounded-lg border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                         <div>
                             <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Email ID</label>
                             <div className="text-slate-200 font-mono text-sm mt-1 select-all">{creds.email}</div>
                         </div>
                         <div>
                             <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Password</label>
                             <div className="text-slate-200 font-mono text-sm mt-1 select-all">{creds.pass}</div>
                         </div>
                    </div>
                )}

                {/* Login Form */}
                {showLogin && (
                    <form onSubmit={handleLogin} className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700 animate-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-white mb-3">Login with Existing Account</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input 
                                type="text" 
                                placeholder="Email..." 
                                className="bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={loginEmail}
                                onChange={e => setLoginEmail(e.target.value)}
                            />
                            <input 
                                type="password" 
                                placeholder="Password..." 
                                className="bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={loginPass}
                                onChange={e => setLoginPass(e.target.value)}
                            />
                        </div>
                        {loginError && <div className="text-red-400 text-xs mb-3">{loginError}</div>}
                        <button 
                            type="submit" 
                            disabled={isLoggingIn}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-bold flex items-center justify-center gap-2"
                        >
                            {isLoggingIn && <RefreshCw className="animate-spin" size={14} />}
                            {isLoggingIn ? "Logging in..." : "Login"}
                        </button>
                    </form>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700 mb-8">
                <button 
                    onClick={() => setActiveTab('watchlist')}
                    className={`pb-4 px-6 text-sm font-medium transition-all relative ${
                        activeTab === 'watchlist' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <div className="flex items-center gap-2">
                         <Clock size={18} /> Watchlist
                    </div>
                    {activeTab === 'watchlist' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('watched')}
                    className={`pb-4 px-6 text-sm font-medium transition-all relative ${
                        activeTab === 'watched' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <div className="flex items-center gap-2">
                         <CheckCircle size={18} /> History
                    </div>
                    {activeTab === 'watched' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-400"></div>}
                </button>
            </div>
            
            {/* List Content */}
            {loadingMovies ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-800 animate-pulse rounded-xl"></div>)}
                </div>
            ) : (
                <>
                    {/* Render List based on Active Tab */}
                    {(activeTab === 'watchlist' ? watchlistMovies : watchedMovies).length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {(activeTab === 'watchlist' ? watchlistMovies : watchedMovies).map(movie => (
                                <MovieCard 
                                    key={movie.id} 
                                    movie={movie} 
                                    onRemove={handleRemove}
                                    onMarkWatched={activeTab === 'watchlist' ? handleMarkWatched : undefined}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 rounded-2xl p-12 text-center border border-dashed border-slate-700">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Film size={32} className="text-slate-600" />
                            </div>
                            <h3 className="text-white font-medium text-lg mb-1">
                                {activeTab === 'watchlist' ? "Your watchlist is empty" : "No watched history yet"}
                            </h3>
                            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                                {activeTab === 'watchlist' 
                                 ? "Start building your watchlist by exploring trending movies." 
                                 : "Mark movies as watched to track your cinematic journey."}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Profile;