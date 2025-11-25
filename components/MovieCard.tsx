import React from 'react';
import { Star, PlusCircle, CheckCircle } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onAdd: (id: number) => void;
  isAdded?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onAdd, isAdded = false }) => {
  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 group">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img 
          src={movie.poster_path} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
      
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg truncate" title={movie.title}>{movie.title}</h3>
        <p className="text-slate-400 text-xs mt-1">{new Date(movie.release_date).getFullYear()}</p>
        
        <button 
          onClick={() => onAdd(movie.id)}
          disabled={isAdded}
          className={`mt-4 w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
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
      </div>
    </div>
  );
};

export default MovieCard;