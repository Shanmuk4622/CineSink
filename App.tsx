import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import { User, Film, List } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <Chat />;
      case 'profile':
        return <ProfilePlaceholder />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Navbar currentPage={currentPage} setPage={setPage} />
      <main>
        {renderPage()}
      </main>
    </div>
  );
};

// Simple placeholder for the Profile view since Chat and Dashboard are the focus of this prompt
const ProfilePlaceholder: React.FC = () => (
  <div className="max-w-4xl mx-auto p-8">
    <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 flex flex-col md:flex-row items-center gap-8">
      <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-bold">
        VIT
      </div>
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-3xl font-bold text-white">Student Profile</h1>
        <p className="text-slate-400 mt-2">Computer Science • Batch 2025</p>
        <div className="flex gap-4 mt-6 justify-center md:justify-start">
           <div className="text-center px-4 py-2 bg-slate-900 rounded-lg">
             <div className="text-2xl font-bold text-indigo-400">42</div>
             <div className="text-xs text-slate-500 uppercase">Watched</div>
           </div>
           <div className="text-center px-4 py-2 bg-slate-900 rounded-lg">
             <div className="text-2xl font-bold text-yellow-400">12</div>
             <div className="text-xs text-slate-500 uppercase">Watchlist</div>
           </div>
        </div>
      </div>
    </div>

    <h2 className="text-2xl font-bold mt-12 mb-6">Recent Activity</h2>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-lg">
           <div className="bg-green-500/20 p-2 rounded-full text-green-400">
             <Film size={20} />
           </div>
           <div>
             <p className="text-sm"><span className="font-bold text-white">You</span> watched <span className="text-indigo-400 font-medium">Interstellar</span></p>
             <p className="text-xs text-slate-500">2 hours ago</p>
           </div>
        </div>
      ))}
    </div>
  </div>
);

export default App;