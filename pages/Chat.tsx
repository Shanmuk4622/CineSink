import React, { useState, useEffect, useRef } from 'react';
import { ChatRoom, Message, RoomType } from '../types';
import { Send, User, Users, Ghost, Hash, Lock } from 'lucide-react';

const MOCK_ROOMS: ChatRoom[] = [
  { id: '1', name: 'General Chatter', type: RoomType.PUBLIC, active_users: 12 },
  { id: '2', name: 'VITAP Hangout', type: RoomType.PUBLIC, active_users: 24 },
  { id: '3', name: 'Salaar Spoilers', type: RoomType.ANONYMOUS, active_users: 85 },
  { id: '4', name: 'Confessions', type: RoomType.ANONYMOUS, active_users: 7 },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', room_id: '1', user_id: 'u1', content: 'Has anyone seen Dune 2 yet?', created_at: '10:00 AM', is_anonymous: false, display_name: 'Rahul_CSE', display_avatar: 'https://picsum.photos/40/40?random=100' },
    { id: 'm2', room_id: '1', user_id: 'u2', content: 'Yeah, watching it tonight at the campus theater!', created_at: '10:05 AM', is_anonymous: false, display_name: 'Priya_Law', display_avatar: 'https://picsum.photos/40/40?random=101' },
  ],
  '3': [
    { id: 'm3', room_id: '3', user_id: 'u1', content: 'OMG that twist at the end...', created_at: '11:00 PM', is_anonymous: true, display_name: 'Anonymous Fox' },
    { id: 'm4', room_id: '3', user_id: 'u3', content: 'Shh! I am still watching.', created_at: '11:01 PM', is_anonymous: true, display_name: 'Ghostly Bear' },
  ]
};

// Anon name generator
const ANIMALS = ['Fox', 'Bear', 'Owl', 'Wolf', 'Tiger', 'Eagle'];
const ADJECTIVES = ['Anonymous', 'Silent', 'Ghostly', 'Hidden', 'Shadow'];
const getRandomAnonName = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return `${adj} ${animal}`;
};

const Chat: React.FC = () => {
  const [activeRoom, setActiveRoom] = useState<ChatRoom>(MOCK_ROOMS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fake current user
  const currentUser = { id: 'me', username: 'MyProfile', avatar: 'https://picsum.photos/40/40?random=999' };

  useEffect(() => {
    // Load messages when room changes
    setMessages(MOCK_MESSAGES[activeRoom.id] || []);
  }, [activeRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const isAnon = activeRoom.type === RoomType.ANONYMOUS;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      room_id: activeRoom.id,
      user_id: currentUser.id,
      content: input,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_anonymous: isAnon,
      display_name: isAnon ? getRandomAnonName() : currentUser.username,
      display_avatar: isAnon ? undefined : currentUser.avatar
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-900">
      
      {/* Sidebar - Room List */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Hash size={20} className="text-indigo-400" /> Channels
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Public Rooms</div>
          {MOCK_ROOMS.filter(r => r.type === RoomType.PUBLIC).map(room => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                activeRoom.id === room.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-2"># {room.name}</span>
            </button>
          ))}

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Anonymous Zones</div>
          {MOCK_ROOMS.filter(r => r.type === RoomType.ANONYMOUS).map(room => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                activeRoom.id === room.id ? 'bg-rose-900/50 text-rose-200 border border-rose-800' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-2"><Ghost size={14} /> {room.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-700 bg-slate-800/50 flex items-center px-6 justify-between">
          <div className="flex items-center gap-3">
            {activeRoom.type === RoomType.ANONYMOUS ? (
              <div className="bg-rose-600 p-2 rounded-lg">
                <Ghost size={20} className="text-white" />
              </div>
            ) : (
               <div className="bg-indigo-600 p-2 rounded-lg">
                <Hash size={20} className="text-white" />
              </div>
            )}
            <div>
              <h3 className="text-white font-bold">{activeRoom.name}</h3>
              <p className="text-slate-400 text-xs flex items-center gap-1">
                 {activeRoom.type === RoomType.ANONYMOUS ? 'Incognito Mode Active' : 'Public Channel'}
              </p>
            </div>
          </div>
          <div className="text-slate-400 text-sm flex items-center gap-2">
            <Users size={16} /> {activeRoom.active_users} online
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
             <div className="text-center text-slate-500 mt-10">No messages yet. Be the first!</div>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.is_anonymous ? 'bg-rose-900' : 'bg-slate-700'
                }`}>
                  {msg.is_anonymous ? (
                    <Ghost size={20} className="text-rose-400" />
                  ) : (
                    <img src={msg.display_avatar} alt="av" className="w-full h-full rounded-full object-cover" />
                  )}
                </div>

                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-sm font-bold ${
                      msg.is_anonymous ? 'text-rose-400' : 'text-indigo-400'
                    }`}>
                      {msg.display_name}
                    </span>
                    <span className="text-xs text-slate-500">{msg.created_at}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-700 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
           <div className="relative">
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder={`Message #${activeRoom.name} ${activeRoom.type === RoomType.ANONYMOUS ? '(anonymously)' : ''}...`}
               className="w-full bg-slate-900 text-white placeholder-slate-500 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700"
             />
             <button 
               onClick={handleSend}
               className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
             >
               <Send size={20} />
             </button>
           </div>
           {activeRoom.type === RoomType.ANONYMOUS && (
             <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
               <Lock size={12} /> Your identity is hidden in this room.
             </p>
           )}
        </div>

      </div>
    </div>
  );
};

export default Chat;