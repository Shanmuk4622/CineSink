import React from 'react';
import { Star, PlusCircle, CheckCircle, Trash2 } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onAdd?: (id: number) => void;
  onRemove?: (id: number) => void;
  isAdded?: boolean;
  onClick?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onAdd, onRemove, isAdded = false, onClick }) => {
  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 group flex flex-col h-full relative">
      <div 
        className="relative aspect-[2/3] overflow-hidden cursor-pointer"
        onClick={onClick}
      >
        <img 
          src={movie.poster_path} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-0 left-0 p-4 w-full">
           <div className="flex justify-between items-end">
             <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-yellow-400 text-sm font-bold">
               <Star size={14} fill="currentColor" /> {movie.vote_average.toFixed(1)}
             </div>
           </div>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h3 
            className="text-white font-semibold text-lg truncate cursor-pointer hover:text-indigo-400 transition-colors" 
            title={movie.title}
            onClick={onClick}
        >
            {movie.title}
        </h3>
        <p className="text-slate-400 text-xs mt-1">{new Date(movie.release_date).getFullYear()}</p>
        
        <div className="mt-auto pt-4">
            {onRemove ? (
                <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(movie.id);
                }}
                className="w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50"
                >
                    <Trash2 size={16} /> Remove
                </button>
            ) : (
                <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if (onAdd) onAdd(movie.id);
                }}
                disabled={isAdded}
                className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                    isAdded 
                    ? 'bg-green-600/20 text-green-500 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                >
                {isAdded ? (
                    <>
                    <CheckCircle size={16} /> Added
                    </>
                ) : (
                    <>
                    <PlusCircle size={16} /> Watchlist
                    </>
                )}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;