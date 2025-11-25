import React, { useEffect, useState } from 'react';
import { fetchTrendingMovies } from '../services/tmdbService';
import { getAIRecommendations } from '../services/geminiService';
import { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import { Sparkles, Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  
  // AI State
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const loadMovies = async () => {
      const data = await fetchTrendingMovies();
      setMovies(data);
      setLoading(false);
    };
    loadMovies();
  }, []);

  const handleAddToWatchlist = (id: number) => {
    setWatchlist(prev => [...prev, id]);
    // In real app: Supabase insert call here
  };

  const handleGetAiRecs = async () => {
    setLoadingAi(true);
    // Mock user context
    const rec = await getAIRecommendations(
      ["Dune", "Interstellar", "Inception"],
      "Sci-Fi Thriller"
    );
    setAiRecommendation(rec);
    setLoadingAi(false);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-indigo-900/30 border-b border-indigo-900/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to CineSync</h1>
          <p className="text-indigo-200 text-lg">See what's trending at VITAP right now.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* AI Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 mb-12 shadow-xl">
            <div className="flex items-start gap-4">
                <div className="bg-indigo-500/20 p-3 rounded-xl">
                    <Sparkles className="text-indigo-400" size={24} />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white">Gemini AI Assistant</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Not sure what to watch during finals week? Let AI decide.
                    </p>
                    
                    {!aiRecommendation && !loadingAi && (
                        <button 
                            onClick={handleGetAiRecs}
                            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium transition-all"
                        >
                            Get Smart Recommendations
                        </button>
                    )}

                    {loadingAi && (
                        <div className="mt-4 flex items-center gap-2 text-indigo-400">
                            <Loader2 className="animate-spin" size={18} />
                            <span className="text-sm">Gemini is thinking...</span>
                        </div>
                    )}

                    {aiRecommendation && (
                        <div className="mt-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                            {aiRecommendation}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Trending Section */}
        <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-indigo-500">Trending at VITAP</h2>
        
        {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="bg-slate-800 h-96 rounded-xl animate-pulse"></div>
             ))}
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map(movie => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                onAdd={handleAddToWatchlist}
                isAdded={watchlist.includes(movie.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;