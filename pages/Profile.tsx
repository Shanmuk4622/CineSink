import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getMovieById } from '../services/tmdbService';
import { Movie } from '../types';
import { Film, Clock, User, LogOut } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import MovieCard from '../components/MovieCard';

const Profile: React.FC = () => {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
    const [loadingMovies, setLoadingMovies] = useState(false);

    useEffect(() => {
        const loadWatchlist = async () => {
            if (!user) return;
            setLoadingMovies(true);
            try {
                // Fetch Watchlist items
                const { data: libraryData } = await supabase
                    .from('user_library')
                    .select('movie_id')
                    .eq('user_id', user.id)
                    .eq('status', 'watchlist');
                
                if (libraryData && libraryData.length > 0) {
                    // Fetch details for each movie in parallel
                    const moviePromises = libraryData.map(item => getMovieById(item.movie_id));
                    const movies = (await Promise.all(moviePromises)).filter((m): m is Movie => m !== null);
                    setWatchlistMovies(movies);
                } else {
                    setWatchlistMovies([]);
                }

            } catch (error) {
                console.error("Error loading profile movies:", error);
            } finally {
                setLoadingMovies(false);
            }
        };

        if (user) {
            loadWatchlist();
        }
    }, [user]);

    const handleRemove = async (id: number) => {
        if (!user) return;
        
        // Optimistic UI update
        setWatchlistMovies(prev => prev.filter(m => m.id !== id));

        const { error } = await supabase
            .from('user_library')
            .delete()
            .eq('user_id', user.id)
            .eq('movie_id', id);

        if (error) {
            console.error("Error removing movie:", error);
            // Revert on error (optional, but good practice)
        }
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
            <div className="bg-slate-800 rounded-2xl p-6 md:p-10 border border-slate-700 flex flex-col md:flex-row items-center gap-8 shadow-xl relative mb-12">
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
                            <div className="text-2xl font-bold text-indigo-400">{profile.watched_count || 0}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Watched</div>
                        </div>
                        <div className="text-center px-5 py-3 bg-slate-900 rounded-xl border border-slate-700 shadow-sm">
                            <div className="text-2xl font-bold text-yellow-400">{watchlistMovies.length}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Watchlist</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Watchlist Section */}
            <div className="flex items-center gap-3 mb-6">
                <Clock className="text-yellow-400" size={24} /> 
                <h2 className="text-xl font-bold text-white">Your Watchlist</h2>
                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-xs font-bold">{watchlistMovies.length}</span>
            </div>
            
            {loadingMovies ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-800 animate-pulse rounded-xl"></div>)}
                </div>
            ) : watchlistMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {watchlistMovies.map(movie => (
                        <MovieCard 
                            key={movie.id} 
                            movie={movie} 
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-slate-800/50 rounded-2xl p-12 text-center border border-dashed border-slate-700">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Film size={32} className="text-slate-600" />
                    </div>
                    <h3 className="text-white font-medium text-lg mb-1">Your list is empty</h3>
                    <p className="text-slate-400 mb-6 max-w-sm mx-auto">Start building your watchlist by exploring trending movies or searching for your favorites.</p>
                </div>
            )}
        </div>
    );
};

export default Profile;