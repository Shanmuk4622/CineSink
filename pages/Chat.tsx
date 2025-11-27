
import React, { useState, useEffect, useRef } from 'react';
import { ChatRoom, Message, RoomType, Profile } from '../types';
import { 
  Send, Users, Hash, Zap, Loader2, 
  MessageSquare, User, Smile, Eye, Lock, AlertTriangle, ArrowLeft, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

const ANIMALS = ['Panda', 'Tiger', 'Fox', 'Eagle', 'Shark', 'Owl', 'Wolf', 'Bear', 'Lion', 'Hawk'];

const EMOJIS = [
    "😀", "😂", "🥰", "😍", "😎", "😭", "😡", "👍", "👎", "🔥", "✨", "🎉", "💀", "👻", "👀",
    "🤝", "🙏", "💪", "🧠", "🤡", "💩", "🤮", "🤧", "😷", "🥴", "🤫", "🤔", "🤯", "❤️", "💔",
    "💯", "💢", "💥", "💫", "💦", "💤", "👋", "👌", "✌️", "🤞", "🤟", "🤙", "🖕", "☝️", "👇",
    "⚽", "🏀", "🎮", "🚀", "🛸", "🌍", "🌈", "☀️", "🌙", "⭐", "🍎", "🍕", "🍺",
    "🚗", "✈️", "🚨", "💡", "📷", "📱", "💻", "💰", "💎", "🔨", "🛡️", "🏹", "🔮", "🧸"
];

const Chat: React.FC = () => {
  // --- STATE ---
  const { user, profile, loading: authLoading, error: authError } = useAuth();
  
  // Zone A: Sidebar State
  const [publicRooms, setPublicRooms] = useState<ChatRoom[]>([]);
  const [privateRooms, setPrivateRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  
  // Zone B: Chat Area State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- HELPER: STABLE IDENTITY ---
  const getStableAnimal = (userId: string, roomId: string) => {
    let hash = 0;
    const str = userId + roomId;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % ANIMALS.length;
    return ANIMALS[index];
  };

  const myAnonIdentity = (user && activeRoom?.type === 'match') 
    ? getStableAnimal(user.id, activeRoom.id) 
    : null;

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    if (user && profile) {
        fetchRoomsAndMatches(user.id);
    }
  }, [user, profile]);

  const fetchRoomsAndMatches = async (userId: string) => {
      const { data: rooms } = await supabase.from('rooms').select('*').eq('type', 'public');
      if (rooms) setPublicRooms(rooms as ChatRoom[]);

      const { data: myMatches } = await supabase
        .from('room_participants')
        .select('room_id, rooms(*)')
        .eq('user_id', userId);
      
      if (myMatches) {
        const matches = myMatches.map((m: any) => {
            const room = m.rooms;
            return Array.isArray(room) ? room[0] : room;
        }).filter((r: any) => r && r.type === 'match');
        setPrivateRooms(matches as ChatRoom[]);
      }
  };

  // --- 2. RANDOM MATCHMAKING LOGIC ---
  useEffect(() => {
    let queueChannel: any = null;

    if (isSearchingMatch && user) {
        queueChannel = supabase.channel('queue_listener')
            .on(
                'postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'room_participants', filter: `user_id=eq.${user.id}` }, 
                async (payload) => {
                    const newRoomId = payload.new.room_id;
                    await joinMatchRoom(newRoomId);
                }
            )
            .subscribe();
    }

    return () => {
        if (queueChannel) supabase.removeChannel(queueChannel);
    };
  }, [isSearchingMatch, user]);

  const handleFindMatch = async () => {
    if (!user) return;
    setIsSearchingMatch(true);
    try {
      const { data: roomId, error } = await supabase.rpc('find_or_create_match', { my_user_id: user.id });
      if (error) throw error;
      if (roomId) await joinMatchRoom(roomId);
    } catch (e) {
      console.error("Match error", e);
      setIsSearchingMatch(false);
    }
  };

  const joinMatchRoom = async (roomId: string) => {
    setIsSearchingMatch(false);
    const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (data) {
        setPrivateRooms(prev => {
            if (prev.find(r => r.id === roomId)) return prev;
            return [data, ...prev];
        });
        setActiveRoom(data);
    }
  };

  // --- 3. MESSAGING LOGIC (REALTIME & OPTIMISTIC) ---
  
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Subscribe and Load Messages
  // KEY FIX: Only depend on activeRoom.id, not the whole object, to prevent re-renders wiping state
  useEffect(() => {
    if (!activeRoom) return;

    // Reset only if we are truly switching rooms
    setMessages([]); 
    setLoadingMessages(true);
    setShowEmojiPicker(false);

    // 1. Fetch History
    const fetchMsgs = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*, profiles(username, avatar_url)')
            .eq('room_id', activeRoom.id)
            .order('created_at', { ascending: true });
        
        if (data) {
            const history = data.map(m => ({ ...m, status: 'sent' as const }));
            
            // KEY FIX: Merge with existing state (optimistic messages) instead of overwriting
            setMessages(prev => {
                // Keep any 'sending' or 'error' messages we created locally
                const pending = prev.filter(m => m.status === 'sending' || m.status === 'error');
                // Filter out history items that might conflict with pending (unlikely but safe)
                const historyIds = new Set(history.map(h => h.id));
                const uniquePending = pending.filter(p => !historyIds.has(p.id));
                return [...history, ...uniquePending];
            });
            setLoadingMessages(false);
            setTimeout(() => scrollToBottom('auto'), 100);
        } else {
            setLoadingMessages(false);
        }
    };
    fetchMsgs();

    // 2. Realtime Subscription
    const channel = supabase
        .channel(`room:${activeRoom.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom.id}` }, async (payload) => {
            const newMsg = payload.new as Message;
            newMsg.status = 'sent';

            if (newMsg.user_id !== user?.id) {
                const { data: userProfile } = await supabase.from('profiles').select('username, avatar_url').eq('id', newMsg.user_id).single();
                if (userProfile) newMsg.profiles = userProfile as Profile;
            } else {
                newMsg.profiles = profile;
            }

            setMessages(prev => {
                // Deduplication
                if (prev.find(m => m.id === newMsg.id)) return prev;

                // Match optimistic message
                const optimisticMatchIndex = prev.findIndex(m => 
                    m.user_id === newMsg.user_id && 
                    m.content === newMsg.content && 
                    m.status === 'sending'
                );

                if (optimisticMatchIndex !== -1) {
                    const newArr = [...prev];
                    newArr[optimisticMatchIndex] = newMsg;
                    return newArr;
                }
                return [...prev, newMsg];
            });
            setTimeout(() => scrollToBottom('smooth'), 50);
        })
        .subscribe();
        
    return () => { supabase.removeChannel(channel); };
  }, [activeRoom?.id]); // Only re-run if ID changes, ignore other object ref changes


  const sendMessage = async () => {
    // KEY FIX: Allow sending even if loading history
    if (!inputText.trim() || !user || !activeRoom) return;
    
    const textToSend = inputText;
    setInputText(''); 
    setShowEmojiPicker(false);
    
    const isAnon = activeRoom.type === 'match';
    const fakeName = isAnon ? `Anonymous ${getStableAnimal(user.id, activeRoom.id)}` : undefined;
    const tempId = `temp-${Date.now()}`; 

    const optimisticMsg: Message = {
        id: tempId,
        room_id: activeRoom.id,
        user_id: user.id,
        content: textToSend,
        created_at: new Date().toISOString(),
        is_anonymous: isAnon,
        fake_username: fakeName,
        profiles: profile,
        status: 'sending'
    };

    // Instant UI update
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom('smooth'), 10);

    const { data, error } = await supabase.from('messages').insert({
        room_id: activeRoom.id,
        user_id: user.id,
        content: textToSend,
        is_anonymous: isAnon,
        fake_username: fakeName
    }).select().single();

    if (error) {
        console.error("Failed to send", error);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    } else if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, status: 'sent' } : m));
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  // --- RENDER ---
  const isMessageGrouped = (index: number) => {
      if (index === 0) return false;
      const current = messages[index];
      const prev = messages[index - 1];
      const timeDiff = new Date(current.created_at).getTime() - new Date(prev.created_at).getTime();
      return current.user_id === prev.user_id && timeDiff < 5 * 60 * 1000;
  };

  if (authLoading) return <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-slate-900 text-slate-400"><Loader2 className="animate-spin mb-4" size={32} /></div>;
  if (authError) return <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-slate-900 p-8 text-center text-red-400">{authError}</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-900 text-slate-100 overflow-hidden font-sans relative">
      
      {/* SIDEBAR */}
      <div className={`w-full md:w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col absolute md:relative z-10 h-full transition-transform duration-300 ${activeRoom ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
        <div className="p-4 border-b border-slate-800">
           <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Broadcast Channels</h2>
           <div className="space-y-1">
             {publicRooms.map(room => (
               <button key={room.id} onClick={() => setActiveRoom(room)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${activeRoom?.id === room.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                 <Hash size={18} /> <span className="font-medium truncate">#{room.name}</span>
               </button>
             ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
           <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Private Matches</h2>
           <div className="space-y-1">
             {privateRooms.map((room, idx) => (
               <button key={room.id} onClick={() => setActiveRoom(room)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeRoom?.id === room.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"><Zap size={14} className="text-yellow-400" /></div>
                 <div className="flex-1 text-left"><div className="text-sm font-medium text-slate-200">Anon Match #{idx + 1}</div><div className="text-xs text-slate-500 truncate">Active now</div></div>
               </button>
             ))}
             {privateRooms.length === 0 && <div className="text-center py-6 text-slate-600 text-sm italic">No active matches yet.</div>}
           </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <button onClick={handleFindMatch} disabled={isSearchingMatch} className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg transition-all ${isSearchingMatch ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white'}`}>
             {isSearchingMatch ? <><Loader2 size={18} className="animate-spin" /> Searching...</> : <><Zap size={18} fill="currentColor" /> Random 1-on-1</>}
           </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 bg-slate-950/30 relative w-full h-full absolute md:relative transition-transform duration-300 ${activeRoom ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        {activeRoom ? (
            <>
                <div className="h-16 px-4 md:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveRoom(null)} className="md:hidden p-1 mr-1 text-slate-400 hover:text-white"><ArrowLeft size={24} /></button>
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">{activeRoom.type === 'public' ? <Hash size={20} className="text-slate-400" /> : <Zap size={20} className="text-yellow-400" />}</div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">{activeRoom.type === 'public' ? activeRoom.name : 'Anonymous Match'}</h2>
                            <p className="text-xs text-green-400 flex items-center gap-1">{activeRoom.type === 'public' ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Live</> : <span className="text-indigo-400">You are <b>Anonymous {myAnonIdentity}</b></span>}</p>
                        </div>
                    </div>
                    {activeRoom.type === 'match' && (
                        <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${messages.length > 50 ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}`}>
                            {messages.length > 50 ? <Eye size={14} /> : <Lock size={14} />} {messages.length > 50 ? "Reveal Identity" : `Locked (${messages.length}/50)`}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1">
                    {loadingMessages && messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-indigo-400"><Loader2 size={32} className="animate-spin" /></div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60"><MessageSquare size={48} className="mb-4 text-slate-700" /><p>No messages yet. Say hello!</p></div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.user_id === user?.id;
                            const grouped = isMessageGrouped(idx);
                            const displayName = msg.is_anonymous ? (msg.fake_username || "Anonymous") : (msg.profiles?.username || "Student");

                            return (
                                <div key={msg.id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''} ${grouped ? 'mt-1' : 'mt-6'}`}>
                                    <div className="w-10 flex-shrink-0 flex flex-col items-center">
                                        {!isMe && !grouped && (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-slate-700 ${msg.is_anonymous ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-indigo-900'}`}>
                                                {msg.profiles?.avatar_url && !msg.is_anonymous ? <img src={msg.profiles.avatar_url} alt="Av" className="w-full h-full object-cover" /> : <User size={18} className="text-slate-400" />}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {!grouped && <div className="flex items-center gap-2 mb-1 px-1"><span className={`text-sm font-bold ${msg.is_anonymous ? 'text-slate-300' : 'text-indigo-400'}`}>{displayName}</span><span className="text-[10px] text-slate-600">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>}
                                        <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all relative ${isMe ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700'}`}>
                                            {msg.content}
                                            {isMe && <div className="absolute -bottom-4 right-1 text-[10px] opacity-70 flex items-center gap-1">{msg.status === 'sending' && <Clock size={10} className="animate-pulse" />}{msg.status === 'error' && <AlertTriangle size={10} className="text-red-500" />}</div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-800 relative">
                    {showEmojiPicker && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)}></div>
                            <div className="absolute bottom-20 left-4 z-40 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-80 h-72 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-3 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emoji Picker</span>
                                    <button onClick={() => setShowEmojiPicker(false)} className="text-slate-500 hover:text-white"><ArrowLeft size={14}/></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 grid grid-cols-7 gap-1 scrollbar-hide bg-slate-900/90">
                                    {EMOJIS.map(emoji => <button key={emoji} onClick={() => handleAddEmoji(emoji)} className="w-9 h-9 flex items-center justify-center hover:bg-indigo-600/30 rounded-lg text-xl transition-all hover:scale-110 active:scale-95">{emoji}</button>)}
                                </div>
                            </div>
                        </>
                    )}
                    <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700 focus-within:border-indigo-500/50 focus-within:bg-slate-800 transition-all z-20">
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 transition-colors ${showEmojiPicker ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`} title="Add Emoji"><Smile size={24} /></button>
                        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Message..." className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 resize-none max-h-32 min-h-[44px] py-2.5 scrollbar-hide disabled:opacity-50" rows={1} />
                        <button onClick={sendMessage} disabled={!inputText.trim()} className={`p-2 rounded-lg transition-all ${inputText.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><Send size={20} /></button>
                    </div>
                    {activeRoom.type === 'match' && <div className="text-center mt-2"><span className="text-xs text-slate-500 flex items-center justify-center gap-1"><Zap size={10} className="text-yellow-500" /> You are chatting as <b>Anonymous {myAnonIdentity}</b></span></div>}
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8"><div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6"><Users size={40} className="text-indigo-400" /></div><h2 className="text-2xl font-bold text-white mb-2">Welcome to Community Chat</h2><p className="text-slate-400 max-w-md">Select a broadcast channel from the left or click <strong className="text-indigo-400"> Random 1-on-1</strong> to find a movie buddy anonymously.</p></div>
        )}
      </div>

      <div className="w-64 bg-slate-900 border-l border-slate-800 hidden lg:flex flex-col p-6">
        {activeRoom && activeRoom.type === 'public' ? (
            <><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Room Info</h3><p className="text-sm text-slate-400 mb-6">This is a public broadcast channel. Be respectful to your fellow VITAP students.</p></>
        ) : activeRoom && activeRoom.type === 'match' ? (
            <><div className="flex flex-col items-center mt-6"><div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 relative"><Zap size={32} className="text-yellow-400" /><span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></span></div><h3 className="font-bold text-white">Anonymous Match</h3><p className="text-xs text-slate-500 mt-1">Found via Queue</p></div></>
        ) : <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">Select a chat to see details</div>}
      </div>
    </div>
  );
};

export default Chat;
