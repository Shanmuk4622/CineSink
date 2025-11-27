import React from 'react';
import { X, Star, Calendar, PlusCircle, CheckCircle } from 'lucide-react';
import { Movie } from '../types';

interface MovieDetailsModalProps {
  movie: Movie;
  onClose: () => void;
  onAdd: (id: number) => void;
  isAdded: boolean;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({ movie, onClose, onAdd, isAdded }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Backdrop Image */}
        <div className="relative h-64 md:h-80 w-full">
           <img 
             src={movie.backdrop_path || movie.poster_path} 
             alt={movie.title} 
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
           <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
              <h2 className="text-3xl md:text-4xl font-bold text-white shadow-black drop-shadow-lg">{movie.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                  <div className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Star size={16} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1">
                      <Calendar size={16} /> {new Date(movie.release_date).getFullYear()}
                  </div>
              </div>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Plot Overview</h3>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                    {movie.overview || "No synopsis available for this movie."}
                </p>
                
                <div className="mt-8 flex gap-3">
                   <button 
                      onClick={() => onAdd(movie.id)}
                      disabled={isAdded}
                      className={`flex-1 py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                        isAdded 
                          ? 'bg-green-600/20 text-green-500 cursor-default border border-green-600/50'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle size={20} /> Added to Watchlist
                        </>
                      ) : (
                        <>
                          <PlusCircle size={20} /> Add to Watchlist
                        </>
                      )}
                    </button>
                </div>
            </div>
            
            {/* Mini Poster for desktop layout */}
            <div className="hidden md:block w-32 flex-shrink-0">
                 <img src={movie.poster_path} alt="Poster" className="w-full rounded-lg shadow-lg border border-slate-700" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;