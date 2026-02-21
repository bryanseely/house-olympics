import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Trophy, Star, Dices, Zap, Settings, UserPlus, ListTodo, History, Check, X, RefreshCw, Coffee, Crown, ShieldAlert, Edit2, Trash2, Target, Dumbbell, MonitorPlay, Search } from 'lucide-react';

// --- FIREBASE INIT ---
const firebaseConfig = {
  apiKey: "AIzaSyBkGBYBGqpcWfPIKpwPCfT7g0z29AZ8Bso",
  authDomain: "house-olympics.firebaseapp.com",
  projectId: "house-olympics",
  storageBucket: "house-olympics.firebasestorage.app",
  messagingSenderId: "634963412273",
  appId: "1:634963412273:web:6b453fee04a433db231c10"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'my-house-olympics'; // You can leave this as a hardcoded string

// --- HELPER FUNCTIONS ---
function getEventIcon(event, size = 24, className = "") {
  if (!event) return <Dices size={size} className={className} />;
  if (event.type === 'challenge') return <Star size={size} className={className} />;
  if (event.type === 'break') return <Coffee size={size} className={className} />;
  if (event.type === 'game') {
    if (event.category === 'sport') return <Dumbbell size={size} className={className} />;
    if (event.category === 'video_game') return <MonitorPlay size={size} className={className} />;
    return <Dices size={size} className={className} />;
  }
  return <Dices size={size} className={className} />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); 
  
  // Data State
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [powerupModal, setPowerupModal] = useState(null);
  const [championModal, setChampionModal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
        setError("Failed to authenticate. Retrying...");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

   // --- DATA FETCHING ---
  useEffect(() => {
    if (!user) return;

    const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const sessionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'sessions');

    const unsubPlayers = onSnapshot(playersRef, (snap) => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => setError("Error loading players"));

    const unsubEvents = onSnapshot(eventsRef, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => setError("Error loading events"));

    const unsubSessions = onSnapshot(sessionsRef, (snap) => {
      const allSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      allSessions.sort((a, b) => b.createdAt - a.createdAt);
      setSessions(allSessions);
      
      const current = allSessions.find(s => s.status === 'active');
      setActiveSession(current || null);
      if (current) setActiveTab('active');
      
      setLoading(false);
    }, (err) => setError("Error loading sessions"));

    return () => {
      unsubPlayers();
      unsubEvents();
      unsubSessions();
    };
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
      <div className="animate-spin text-indigo-600"><RefreshCw size={48} /></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-400" size={28} />
          <h1 className="text-xl font-bold tracking-tight">House Olympics</h1>
        </div>
        {activeSession && <div className="text-xs bg-indigo-800 px-3 py-1 rounded-full animate-pulse flex items-center gap-1 font-semibold">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div> LIVE
        </div>}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={16} /></button>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard players={players} sessions={sessions} />}
        {activeTab === 'library' && <Library players={players} events={events} db={db} appId={appId} setConfirmDialog={setConfirmDialog} />}
        {activeTab === 'setup' && <SetupSession players={players} events={events} db={db} appId={appId} setActiveTab={setActiveTab} />}
        {activeTab === 'active' && activeSession && (
           <ActiveSession 
             session={activeSession} 
             db={db} 
             appId={appId} 
             players={players}
             setPowerupModal={setPowerupModal}
             setChampionModal={setChampionModal}
             setConfirmDialog={setConfirmDialog}
           />
        )}
        {activeTab === 'active' && !activeSession && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 mt-10 animate-in fade-in duration-500">
            <Trophy size={72} className="text-slate-300 mb-6 drop-shadow-sm" />
            <h2 className="text-3xl font-black text-slate-700 mb-2">No Active Olympics</h2>
            <p className="text-slate-500 mb-8 font-medium">Gather the competitors and prepare for glory!</p>
            <button 
              onClick={() => setActiveTab('setup')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3"
            >
              <Zap size={24} className="fill-white" /> Start New Session
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full flex justify-around p-2 pb-safe z-20 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        <NavButton active={activeTab === 'active'} onClick={() => setActiveTab('active')} icon={<Zap size={22}/>} label="Live" pulse={!!activeSession} />
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<History size={22}/>} label="Stats" />
        <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<ListTodo size={22}/>} label="Library" />
        {!activeSession && <NavButton active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} icon={<Settings size={22}/>} label="Setup" />}
      </nav>

      {/* Modals */}
      {powerupModal && <PowerupModal data={powerupModal} onClose={() => setPowerupModal(null)} />}
      {championModal && <ChampionModal data={championModal} onClose={() => setChampionModal(null)} />}
      {confirmDialog && <ConfirmModal data={confirmDialog} onClose={() => setConfirmDialog(null)} />}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavButton({ active, onClick, icon, label, pulse }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center w-16 h-14 transition-colors rounded-xl ${active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-50'}`}
    >
      <div className="relative">
        {icon}
        {pulse && !active && <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>}
      </div>
      <span className="text-[10px] font-bold mt-1">{label}</span>
    </button>
  );
}

// --- DASHBOARD ---
function Dashboard({ players, sessions }) {
  const sortedPlayers = [...players].sort((a, b) => (b.lifetimePointsChamps || 0) - (a.lifetimePointsChamps || 0) || (b.lifetimeTotalPoints || 0) - (a.lifetimeTotalPoints || 0));
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-sm"><Crown size={24} className="fill-white"/> Hall of Fame</h2>
        </div>
        <div className="p-4">
          {sortedPlayers.length === 0 ? (
            <p className="text-slate-500 italic text-sm text-center py-4">No players yet. Add them in the Library.</p>
          ) : (
            <div className="space-y-3">
              {sortedPlayers.map((p, i) => (
                <div key={p.id} className="flex flex-col p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 ring-2 ring-yellow-200' : i === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800' : i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900' : 'bg-white text-slate-600 border'}`}>
                        {i + 1}
                      </div>
                      <span className="font-bold text-slate-800 text-lg">{p.name}</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center bg-indigo-50 px-2 py-1 rounded-lg">
                        <span className="text-indigo-400 text-[10px] uppercase font-bold">Champs</span>
                        <span className="font-black text-indigo-700 flex items-center gap-1">{p.lifetimePointsChamps || 0}</span>
                      </div>
                      <div className="flex flex-col items-center bg-yellow-50 px-2 py-1 rounded-lg">
                        <span className="text-yellow-600 text-[10px] uppercase font-bold">Stars</span>
                        <span className="font-black text-yellow-700 flex items-center gap-1">{p.lifetimeStarsChamps || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 bg-white p-2 rounded-xl border border-slate-100">
                    <span className="font-medium">Total Pts: <b className="text-slate-700">{p.lifetimeTotalPoints || 0}</b></span>
                    <span className="font-medium">Total Stars: <b className="text-slate-700">{p.lifetimeTotalStars || 0}</b></span>
                    <span className="font-medium">Game Wins: <b className="text-slate-700">{p.lifetimeGameWins || 0}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><History className="text-indigo-500" /> Past Olympics</h2>
        {completedSessions.length === 0 ? (
          <p className="text-slate-500 italic text-sm text-center py-4">No completed sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {completedSessions.map(session => (
              <div key={session.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{session.name}</h3>
                  <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-1 rounded-lg shadow-sm">{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm">
                    <Trophy size={14} className="text-indigo-600"/> Champ: <b className="font-black">{players.find(p=>p.id===session.pointsChampId)?.name || 'Unknown'}</b>
                  </div>
                  {session.starsChampId && (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm">
                      <Star size={14} className="fill-yellow-500 text-yellow-600"/> Stars: <b className="font-black">{players.find(p=>p.id===session.starsChampId)?.name || 'Unknown'}</b>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- LIBRARY (CRUD for Players & Events) ---
function Library({ players, events, db, appId, setConfirmDialog }) {
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [newPlayer, setNewPlayer] = useState('');
  
  const [editingEvent, setEditingEvent] = useState(null); // null means creating new
  const [eventForm, setEventForm] = useState({ name: '', type: 'game', category: 'game', powerups: [], description: '' });
  const [tempPowerup, setTempPowerup] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('a-z');

  // Players logic
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayer.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'players'), {
      name: newPlayer.trim(),
      lifetimePointsChamps: 0,
      lifetimeStarsChamps: 0,
      lifetimeGameWins: 0,
      lifetimeChallengeWins: 0,
      lifetimeTotalPoints: 0,
      lifetimeTotalStars: 0
    });
    setNewPlayer('');
  };

  const startEditPlayer = (p) => {
    setEditingPlayerId(p.id);
    setEditPlayerName(p.name);
  };

  const saveEditPlayer = async (id) => {
    if (!editPlayerName.trim()) return setEditingPlayerId(null);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', id), { name: editPlayerName.trim() });
    setEditingPlayerId(null);
  };

  const requestDeletePlayer = (p) => {
    setConfirmDialog({
      title: "Delete Player",
      message: `Are you sure you want to delete ${p.name}? This will permanently remove all their lifetime stats.`,
      confirmText: "Delete",
      confirmStyle: "danger",
      onConfirm: async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id));
      }
    });
  };

  // Events logic
  const startEditEvent = (e) => {
    setEditingEvent(e.id);
    setEventForm({ name: e.name, type: e.type, category: e.category || 'game', powerups: e.powerups || [], description: e.description || '' });
    window.scrollTo({ top: document.getElementById('event-form').offsetTop - 20, behavior: 'smooth' });
  };

  const cancelEditEvent = () => {
    setEditingEvent(null);
    setEventForm({ name: '', type: 'game', category: 'game', powerups: [], description: '' });
    setTempPowerup('');
  };

  const handleAddPowerup = () => {
    if (!tempPowerup.trim()) return;
    setEventForm(prev => ({ ...prev, powerups: [...prev.powerups, tempPowerup.trim()] }));
    setTempPowerup('');
  };

  const removePowerup = (index) => {
    setEventForm(prev => ({ ...prev, powerups: prev.powerups.filter((_, i) => i !== index) }));
  };

  const saveEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.name.trim()) return;

    const eventData = {
      name: eventForm.name.trim(),
      type: eventForm.type,
      category: eventForm.type === 'game' ? eventForm.category : null,
      powerups: eventForm.type === 'game' ? eventForm.powerups : [],
      description: eventForm.type === 'challenge' ? eventForm.description.trim() : ''
    };

    if (editingEvent) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEvent), eventData);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), eventData);
    }
    cancelEditEvent();
  };

  const requestDeleteEvent = (e) => {
    setConfirmDialog({
      title: "Delete Event",
      message: `Are you sure you want to remove '${e.name}' from the event pool?`,
      confirmText: "Delete",
      confirmStyle: "danger",
      onConfirm: async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', e.id));
        if (editingEvent === e.id) cancelEditEvent();
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
      
      {/* Players Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800"><UserPlus className="text-indigo-500" /> Manage Roster</h2>
        <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="New Player Name" 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
          />
          <button type="submit" disabled={!newPlayer.trim()} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">Add</button>
        </form>
        
        <div className="space-y-2">
          {players.map(p => (
            <div key={p.id} className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center justify-between">
              {editingPlayerId === p.id ? (
                <div className="flex flex-1 gap-2 mr-2">
                  <input 
                    autoFocus
                    type="text"
                    className="flex-1 bg-white border border-indigo-300 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none"
                    value={editPlayerName}
                    onChange={(e) => setEditPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditPlayer(p.id)}
                  />
                  <button onClick={() => saveEditPlayer(p.id)} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold">Save</button>
                </div>
              ) : (
                <span className="font-bold text-slate-700 ml-2">{p.name}</span>
              )}
              
              {!editingPlayerId && (
                <div className="flex items-center gap-1">
                  <button onClick={() => startEditPlayer(p)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 size={16}/></button>
                  <button onClick={() => requestDeletePlayer(p)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              )}
            </div>
          ))}
          {players.length === 0 && <span className="text-slate-400 text-sm italic block text-center py-2">No players added.</span>}
        </div>
      </div>

      {/* Events Form Section */}
      <div id="event-form" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 ring-1 ring-slate-100">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800">
          <Dices className="text-indigo-500" /> {editingEvent ? 'Edit Event' : 'Add to Event Pool'}
        </h2>
        
        <form onSubmit={saveEvent} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event Type</label>
            <div className="flex gap-2 mt-1.5">
              <button type="button" onClick={() => setEventForm({...eventForm, type: 'game'})} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${eventForm.type === 'game' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>Game</button>
              <button type="button" onClick={() => setEventForm({...eventForm, type: 'challenge'})} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${eventForm.type === 'challenge' ? 'bg-yellow-500 text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>Challenge</button>
              <button type="button" onClick={() => setEventForm({...eventForm, type: 'break'})} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${eventForm.type === 'break' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>Break</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event Name</label>
            <input 
              type="text" 
              placeholder={eventForm.type === 'game' ? "e.g. Mario Kart, Poker" : eventForm.type === 'challenge' ? "e.g. One-Leg Stand" : "e.g. Snack Time"}
              className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={eventForm.name}
              onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
            />
          </div>

          {eventForm.type === 'game' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Game Category</label>
              <div className="flex gap-2 mt-1.5 mb-2">
                <button type="button" onClick={() => setEventForm({...eventForm, category: 'sport'})} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${eventForm.category === 'sport' ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500' : 'bg-white text-slate-500 border border-slate-200'}`}>Sport</button>
                <button type="button" onClick={() => setEventForm({...eventForm, category: 'game'})} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${eventForm.category === 'game' ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500' : 'bg-white text-slate-500 border border-slate-200'}`}>Game</button>
                <button type="button" onClick={() => setEventForm({...eventForm, category: 'video_game'})} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${eventForm.category === 'video_game' ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500' : 'bg-white text-slate-500 border border-slate-200'}`}>Video Game</button>
              </div>
            </div>
          )}

          {eventForm.type === 'challenge' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Challenge Description (Optional)</label>
              <textarea 
                placeholder="Explain the rules of the challenge..." 
                className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none h-24"
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
              />
            </div>
          )}

          {eventForm.type === 'game' && (
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1.5 mb-2"><Zap size={14} className="fill-orange-400"/> Game Power-Ups</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  placeholder="e.g. Play blindfolded, +5 extra points" 
                  className="flex-1 bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={tempPowerup}
                  onChange={(e) => setTempPowerup(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPowerup())}
                />
                <button type="button" onClick={handleAddPowerup} disabled={!tempPowerup.trim()} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Add</button>
              </div>
              
              {eventForm.powerups.length > 0 ? (
                <ul className="space-y-1.5">
                  {eventForm.powerups.map((pu, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm bg-white border border-orange-100 px-3 py-2 rounded-lg text-slate-700 shadow-sm">
                      <span className="font-medium">{pu}</span>
                      <button type="button" onClick={() => removePowerup(idx)} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-orange-600/70 italic text-center py-2">No power-ups defined for this game yet.</div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {editingEvent && (
              <button type="button" onClick={cancelEditEvent} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold transition-colors hover:bg-slate-200">
                Cancel
              </button>
            )}
            <button type="submit" disabled={!eventForm.name.trim()} className="flex-[2] bg-slate-800 text-white py-3 rounded-xl font-bold shadow-md hover:bg-slate-900 transition-colors disabled:opacity-50">
              {editingEvent ? 'Save Changes' : 'Add to Pool'}
            </button>
          </div>
        </form>
      </div>

      {/* Events List Section */}
      <div className="space-y-3 mt-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Current Event Pool</h3>
        
        {/* Search & Filters */}
        <div className="flex flex-col gap-2 px-1 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search event pool..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <select 
               value={eventFilter} 
               onChange={(e) => setEventFilter(e.target.value)}
               className="flex-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
            >
               <option value="all">All Types</option>
               <option value="sport">Sports</option>
               <option value="game">Board/Card Games</option>
               <option value="video_game">Video Games</option>
               <option value="challenge">Challenges</option>
               <option value="break">Breaks</option>
            </select>
            <select 
               value={sortOrder} 
               onChange={(e) => setSortOrder(e.target.value)}
               className="flex-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
            >
               <option value="a-z">A-Z</option>
               <option value="z-a">Z-A</option>
               <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {events.filter(e => {
            if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (eventFilter === 'all') return true;
            if (eventFilter === 'challenge') return e.type === 'challenge';
            if (eventFilter === 'break') return e.type === 'break';
            const cat = e.category || 'game';
            return e.type === 'game' && cat === eventFilter;
        }).sort((a, b) => {
            if (sortOrder === 'a-z') return a.name.localeCompare(b.name);
            if (sortOrder === 'z-a') return b.name.localeCompare(a.name);
            return 0; // fallback to default order
        }).map(e => (
          <div key={e.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 shadow-sm rounded-2xl group transition-all hover:border-indigo-200">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-xl ${e.type === 'game' ? 'bg-indigo-50 text-indigo-500' : e.type === 'challenge' ? 'bg-yellow-50 text-yellow-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {getEventIcon(e, 24)}
              </div>
              <div className="truncate pr-2">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-slate-800 text-base truncate">{e.name}</div>
                  {e.type === 'game' && (
                    <span className="bg-slate-100 text-slate-500 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md shrink-0">
                      {e.category === 'sport' ? 'Sport' : e.category === 'video_game' ? 'Video Game' : 'Board/Card'}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-0.5">
                  {e.type === 'challenge' && e.description && <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">{e.description}</div>}
                  {e.type === 'game' && e.powerups?.length > 0 && <div className="text-[10px] text-orange-500 font-bold flex items-center gap-1"><Zap size={10} className="fill-orange-500"/> {e.powerups.length} Power-ups</div>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
               <button onClick={() => startEditEvent(e)} className="p-2 text-slate-400 hover:text-indigo-500 bg-slate-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
               <button onClick={() => requestDeleteEvent(e)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="text-center py-8 text-slate-400 font-medium italic">No events in pool.</div>}
      </div>

    </div>
  );
}

// --- SETUP SESSION ---
function SetupSession({ players, events, db, appId, setActiveTab }) {
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [maxPowerups, setMaxPowerups] = useState(2);
  const [sessionName, setSessionName] = useState(`House Olympics ${new Date().getFullYear()}`);

  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('a-z');

  const togglePlayer = (id) => {
    setSelectedPlayers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addToSchedule = (event) => {
    // We add an activePowerups array to track powerups used specifically during this instance of the event.
    setSchedule(prev => [...prev, { ...event, instanceId: Date.now() + Math.random(), status: 'pending', activePowerups: [] }]);
  };

  const removeFromSchedule = (index) => {
    setSchedule(prev => prev.filter((_, i) => i !== index));
  };

  const moveItem = (index, direction) => {
    const newSchedule = [...schedule];
    if (direction === 'up' && index > 0) {
      [newSchedule[index - 1], newSchedule[index]] = [newSchedule[index], newSchedule[index - 1]];
    } else if (direction === 'down' && index < newSchedule.length - 1) {
      [newSchedule[index + 1], newSchedule[index]] = [newSchedule[index], newSchedule[index + 1]];
    }
    setSchedule(newSchedule);
  };

  const handleStart = async () => {
    const activePlayers = players.filter(p => selectedPlayers[p.id]).map(p => ({
      id: p.id,
      name: p.name,
      score: 0,
      stars: 0,
      totalGameWins: 0,
      powerupsLeft: maxPowerups
    }));

    if (activePlayers.length < 2) return alert("Select at least 2 players!");
    if (schedule.length === 0) return alert("Add at least one event to the schedule!");

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sessions'), {
      name: sessionName,
      createdAt: Date.now(),
      status: 'active',
      players: activePlayers,
      schedule: schedule,
      currentEventIndex: 0,
      maxPowerups
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-lg font-black mb-4 text-slate-800 flex items-center gap-2"><Target className="text-indigo-500"/> 1. Competitors</h2>
        <div className="grid grid-cols-2 gap-3">
          {players.map(p => (
            <label key={p.id} className={`flex items-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlayers[p.id] ? 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}>
              <input type="checkbox" className="hidden" checked={!!selectedPlayers[p.id]} onChange={() => togglePlayer(p.id)} />
              <div className={`w-5 h-5 rounded-md mr-3 flex items-center justify-center transition-colors ${selectedPlayers[p.id] ? 'bg-indigo-600' : 'bg-white border-2 border-slate-300'}`}>
                {selectedPlayers[p.id] && <Check size={14} className="text-white"/>}
              </div>
              <span className="font-bold text-sm truncate">{p.name}</span>
            </label>
          ))}
        </div>
        {players.length === 0 && <p className="text-sm text-red-500 mt-2 font-medium">Go to Library to add players first.</p>}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-lg font-black mb-4 text-slate-800 flex items-center gap-2"><Settings className="text-slate-500"/> 2. Rules</h2>
        <div className="flex flex-col gap-3">
           <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Session Name</label>
             <input type="text" value={sessionName} onChange={(e) => setSessionName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mt-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
           </div>
           
           <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Power-ups per Player</label>
             <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200 w-fit mt-1.5">
               <button onClick={() => setMaxPowerups(Math.max(0, maxPowerups - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 font-bold active:scale-95 transition-transform">-</button>
               <span className="font-black text-lg w-6 text-center text-slate-800">{maxPowerups}</span>
               <button onClick={() => setMaxPowerups(maxPowerups + 1)} className="w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-lg shadow-sm font-bold active:scale-95 transition-transform">+</button>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 overflow-hidden">
        <h2 className="text-lg font-black mb-4 text-slate-800 flex items-center gap-2"><ListTodo className="text-indigo-500"/> 3. Build Schedule</h2>
        
        {/* Search & Filters for Schedule Builder */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search events to add..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <select 
               value={eventFilter} 
               onChange={(e) => setEventFilter(e.target.value)}
               className="flex-1 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
            >
               <option value="all">All Types</option>
               <option value="sport">Sports</option>
               <option value="game">Board/Card Games</option>
               <option value="video_game">Video Games</option>
               <option value="challenge">Challenges</option>
               <option value="break">Breaks</option>
            </select>
            <select 
               value={sortOrder} 
               onChange={(e) => setSortOrder(e.target.value)}
               className="flex-[0.5] bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
            >
               <option value="a-z">A-Z</option>
               <option value="z-a">Z-A</option>
            </select>
          </div>
        </div>

        {/* Pool to pick from (Vertical List) */}
        <div className="mb-6 h-[35vh] min-h-[250px] overflow-y-auto space-y-2 p-2 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner">
          {events.filter(e => {
              if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
              if (eventFilter === 'all') return true;
              if (eventFilter === 'challenge') return e.type === 'challenge';
              if (eventFilter === 'break') return e.type === 'break';
              const cat = e.category || 'game';
              return e.type === 'game' && cat === eventFilter;
          }).sort((a, b) => {
              if (sortOrder === 'a-z') return a.name.localeCompare(b.name);
              if (sortOrder === 'z-a') return b.name.localeCompare(a.name);
              return 0; 
          }).map(e => (
            <div 
              key={e.id} 
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${e.type === 'game' ? 'bg-indigo-50 text-indigo-500' : e.type === 'challenge' ? 'bg-yellow-50 text-yellow-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  {getEventIcon(e, 20)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800 leading-tight">{e.name}</span>
                  {e.type === 'game' && (
                    <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">
                      {e.category === 'sport' ? 'Sport' : e.category === 'video_game' ? 'Video Game' : 'Board/Card Game'}
                    </span>
                  )}
                  {e.type !== 'game' && (
                     <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">
                      {e.type === 'challenge' ? 'Challenge' : 'Break'}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => addToSchedule(e)} 
                className="w-10 h-10 shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors active:scale-95 shadow-sm"
                aria-label={`Add ${e.name} to schedule`}
              >
                <span className="font-bold text-2xl leading-none -mt-1">+</span>
              </button>
            </div>
          ))}
          {events.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6 text-center">
               <span className="text-sm font-medium">No matching events found.</span>
            </div>
          )}
        </div>

        {/* Current Schedule */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 min-h-[150px]">
          {schedule.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6 text-center">
               <div className="w-12 h-12 border-2 border-dashed border-slate-300 rounded-xl mb-2 flex items-center justify-center"><Dices size={20} className="text-slate-300"/></div>
               <span className="text-sm font-bold">Tap events above to build your order</span>
            </div>
          ) : (
            schedule.map((item, index) => (
              <div key={item.instanceId} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-slate-400 font-black text-xs w-4">{index + 1}.</span>
                  <div className={`p-1.5 rounded-lg ${item.type === 'game' ? 'bg-indigo-50 text-indigo-500' : item.type === 'challenge' ? 'bg-yellow-50 text-yellow-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {getEventIcon(item, 16)}
                  </div>
                  <span className="font-bold text-sm text-slate-700 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 rounded-lg ml-2">
                  <div className="flex flex-col border-r border-slate-200">
                    <button onClick={() => moveItem(index, 'up')} disabled={index===0} className="px-2 py-1 text-slate-400 hover:text-slate-800 disabled:opacity-30">▲</button>
                    <button onClick={() => moveItem(index, 'down')} disabled={index===schedule.length-1} className="px-2 py-1 text-slate-400 hover:text-slate-800 disabled:opacity-30">▼</button>
                  </div>
                  <button onClick={() => removeFromSchedule(index)} className="p-2 text-red-400 hover:text-red-600"><X size={16}/></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button 
        onClick={handleStart}
        className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group mt-4"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        <Trophy className="relative z-10" /> <span className="relative z-10">Let the Games Begin!</span>
      </button>
      <div className="h-8"></div>
    </div>
  );
}

// --- ACTIVE SESSION (The Main Event Screen) ---
function ActiveSession({ session, db, appId, players, setPowerupModal, setChampionModal, setConfirmDialog }) {
  const currentEvent = session.schedule[session.currentEventIndex];
  const isFinished = session.currentEventIndex >= session.schedule.length;

  const [pointsInput, setPointsInput] = useState({});
  const [starsInput, setStarsInput] = useState({}); 

  // Reset inputs when event changes
  useEffect(() => {
    setPointsInput({});
    setStarsInput({});
  }, [session.currentEventIndex]);

  const handleUsePowerup = async (playerId) => {
    if (!currentEvent || currentEvent.type !== 'game' || !currentEvent.powerups || currentEvent.powerups.length === 0) return;
    
    const playerInSession = session.players.find(p => p.id === playerId);
    if (playerInSession.powerupsLeft <= 0) return;

    // Check if player already used one THIS event
    const activePowerups = currentEvent.activePowerups || [];
    if (activePowerups.some(ap => ap.playerId === playerId)) return;

    // Randomization logic is handled purely visually in the Modal now, but we select the final one here
    const randomPu = currentEvent.powerups[Math.floor(Math.random() * currentEvent.powerups.length)];
    
    // Deduct count
    const updatedPlayers = session.players.map(p => 
      p.id === playerId ? { ...p, powerupsLeft: p.powerupsLeft - 1 } : p
    );

    // Save activated powerup to the event schedule
    const updatedSchedule = [...session.schedule];
    if(!updatedSchedule[session.currentEventIndex].activePowerups) {
      updatedSchedule[session.currentEventIndex].activePowerups = [];
    }
    updatedSchedule[session.currentEventIndex].activePowerups.push({
      playerId,
      powerup: randomPu
    });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', session.id), {
      players: updatedPlayers,
      schedule: updatedSchedule
    });

    setPowerupModal({
      playerName: playerInSession.name,
      eventName: currentEvent.name,
      finalPowerup: randomPu,
      allPowerups: currentEvent.powerups
    });
  };

  const handleSaveResults = async () => {
    let updatedPlayers = [...session.players];
    let resultsSaved = {};

    if (currentEvent.type === 'game') {
      let maxPoints = -1;
      let winners = [];
      Object.entries(pointsInput).forEach(([pId, ptsStr]) => {
        const pts = parseInt(ptsStr) || 0;
        if (pts > maxPoints) { maxPoints = pts; winners = [pId]; }
        else if (pts === maxPoints) { winners.push(pId); }
      });

      updatedPlayers = updatedPlayers.map(p => {
        const ptsEarned = parseInt(pointsInput[p.id]) || 0;
        return {
          ...p,
          score: p.score + ptsEarned,
          totalGameWins: winners.includes(p.id) && ptsEarned > 0 ? p.totalGameWins + 1 : p.totalGameWins
        };
      });
      resultsSaved = { points: pointsInput, winners };
    } 
    else if (currentEvent.type === 'challenge') {
      updatedPlayers = updatedPlayers.map(p => ({
        ...p,
        stars: starsInput[p.id] ? p.stars + 1 : p.stars
      }));
      resultsSaved = { stars: starsInput };
    }

    const updatedSchedule = [...session.schedule];
    updatedSchedule[session.currentEventIndex].status = 'completed';
    updatedSchedule[session.currentEventIndex].results = resultsSaved;

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', session.id), {
      players: updatedPlayers,
      schedule: updatedSchedule,
      currentEventIndex: session.currentEventIndex + 1
    });
  };

  const handleEndOlympics = async () => {
    let pointsChamp = null;
    let maxScore = -1;
    let maxWins = -1;
    let starsChamp = null;
    let maxStars = -1;

    session.players.forEach(p => {
      // Points Champ Logic
      if (p.score > maxScore) {
        maxScore = p.score; maxWins = p.totalGameWins; pointsChamp = p;
      } else if (p.score === maxScore) {
        if (p.totalGameWins > maxWins) { maxWins = p.totalGameWins; pointsChamp = p; } 
      }
      // Stars Champ logic
      if (p.stars > maxStars && p.stars > 0) {
        maxStars = p.stars; starsChamp = p;
      }
    });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', session.id), {
      status: 'completed',
      pointsChampId: pointsChamp?.id || null,
      starsChampId: starsChamp?.id || null
    });

    // Update global player stats
    for (const p of session.players) {
      const globalPlayer = players.find(gp => gp.id === p.id);
      if (globalPlayer) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id), {
          lifetimePointsChamps: (globalPlayer.lifetimePointsChamps || 0) + (pointsChamp?.id === p.id ? 1 : 0),
          lifetimeStarsChamps: (globalPlayer.lifetimeStarsChamps || 0) + (starsChamp?.id === p.id ? 1 : 0),
          lifetimeGameWins: (globalPlayer.lifetimeGameWins || 0) + p.totalGameWins,
          lifetimeChallengeWins: (globalPlayer.lifetimeChallengeWins || 0) + p.stars,
          lifetimeTotalPoints: (globalPlayer.lifetimeTotalPoints || 0) + p.score,
          lifetimeTotalStars: (globalPlayer.lifetimeTotalStars || 0) + p.stars
        });
      }
    }

    setChampionModal({ pointsChamp, starsChamp });
  };
  
  const requestCancelSession = () => {
    setConfirmDialog({
      title: "Abandon Session",
      message: "Are you sure you want to completely cancel this Olympics? All scores and progress will be lost immediately.",
      confirmText: "Abandon",
      confirmStyle: "danger",
      onConfirm: async () => {
         await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', session.id));
      }
    });
  };

  const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score || b.totalGameWins - a.totalGameWins);
  const activePowerups = currentEvent?.activePowerups || [];

  return (
    <div className="space-y-4 pb-10">
      
      {/* LEADERBOARD WIDGET */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden ring-1 ring-slate-800/50">
        <div className="absolute -top-10 -right-10 opacity-10 rotate-12"><Trophy size={150}/></div>
        <div className="flex justify-between items-center mb-4 relative z-10">
            <h2 className="text-sm uppercase tracking-widest font-black text-slate-300">Live Standings</h2>
            <span className="text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">{session.name}</span>
        </div>
        
        <div className="space-y-2 relative z-10">
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${i===0 ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-200' : 'bg-slate-700 text-white'}`}>{i+1}</span>
                <span className="font-bold text-lg">{p.name}</span>
              </div>
              <div className="flex items-center gap-5 text-sm font-black">
                <span className="flex items-center gap-1.5 justify-end text-yellow-300"><Star size={16} className="fill-yellow-400"/> {p.stars}</span>
                <span className="flex items-center justify-end text-white w-14 text-right">{p.score} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CURRENT EVENT ACTION CARD */}
      {!isFinished ? (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
          
          {/* Header */}
          <div className={`p-6 text-white flex items-center gap-4 ${currentEvent.type === 'game' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : currentEvent.type === 'challenge' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`}>
            <div className="bg-white/20 p-3 rounded-2xl shadow-inner backdrop-blur-sm">
              {getEventIcon(currentEvent, 32)}
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">
                Event {session.currentEventIndex + 1} of {session.schedule.length}
              </div>
              <h2 className="text-3xl font-black leading-tight drop-shadow-sm">{currentEvent.name}</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* CHALLENGE DESCRIPTION */}
            {currentEvent.type === 'challenge' && currentEvent.description && (
               <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-900 shadow-inner">
                 <div className="font-black uppercase tracking-wider text-yellow-600 mb-1 text-[10px]">Challenge Rules</div>
                 <p className="font-medium leading-relaxed">{currentEvent.description}</p>
               </div>
            )}

            {/* POWER UP SECTION */}
            {currentEvent.type === 'game' && currentEvent.powerups?.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-orange-800 font-black uppercase tracking-wide flex items-center gap-2 mb-4 text-sm">
                  <Zap className="fill-orange-400 text-orange-500" size={18} /> Power-Ups Available!
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {session.players.map(p => {
                    const hasUsedInThisEvent = activePowerups.some(ap => ap.playerId === p.id);
                    
                    return (
                      <button 
                        key={p.id}
                        onClick={() => handleUsePowerup(p.id)}
                        disabled={p.powerupsLeft <= 0 || hasUsedInThisEvent}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 shadow-sm transition-all ${hasUsedInThisEvent ? 'bg-orange-100 border-orange-300 opacity-90' : p.powerupsLeft > 0 ? 'bg-white border-orange-200 hover:border-orange-400 active:scale-95' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}
                      >
                        <span className="font-bold text-sm text-slate-800">{p.name}</span>
                        
                        {/* Powerups left indicator */}
                        <div className="flex gap-1.5 mt-2">
                          {Array.from({length: session.maxPowerups}).map((_, i) => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < p.powerupsLeft ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.6)]' : 'bg-slate-200'}`}></div>
                          ))}
                        </div>

                        {hasUsedInThisEvent ? (
                          <span className="text-[10px] uppercase font-black text-orange-700 mt-2 bg-white px-2 py-0.5 rounded-full shadow-sm ring-1 ring-orange-200">Used for game</span>
                        ) : p.powerupsLeft > 0 ? (
                          <span className="text-[10px] uppercase font-black text-white mt-2 bg-orange-500 px-3 py-1 rounded-full shadow-sm">Activate</span>
                        ) : (
                          <span className="text-[10px] uppercase font-black text-slate-400 mt-2">Empty</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* RESULTS INPUT */}
            {currentEvent.type !== 'break' && (
              <div>
                <h3 className="font-black text-slate-800 mb-3 text-lg flex items-center gap-2"><Target size={20} className="text-slate-400"/> Record Results</h3>
                <div className="space-y-3">
                  {session.players.map(p => {
                    // Find if they have an active powerup for visual flair
                    const activePowerup = activePowerups.find(ap => ap.playerId === p.id);

                    return (
                    <div key={p.id} className="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-lg ml-1">{p.name}</span>
                        
                        {currentEvent.type === 'game' && (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Points</span>
                            <input 
                              type="number" 
                              min="0"
                              className="w-16 h-10 bg-white border border-slate-300 rounded-xl p-2 text-center font-black text-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                              value={pointsInput[p.id] || ''}
                              onChange={(e) => setPointsInput({...pointsInput, [p.id]: e.target.value})}
                            />
                          </div>
                        )}

                        {currentEvent.type === 'challenge' && (
                          <label className={`flex items-center justify-center w-14 h-12 rounded-xl border-2 cursor-pointer transition-all active:scale-95 shadow-sm ${starsInput[p.id] ? 'bg-yellow-100 border-yellow-400 text-yellow-600' : 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50'}`}>
                            <input type="checkbox" className="hidden" checked={!!starsInput[p.id]} onChange={() => setStarsInput({...starsInput, [p.id]: !starsInput[p.id]})} />
                            <Star size={24} className={starsInput[p.id] ? "fill-yellow-400 text-yellow-500 drop-shadow-sm" : ""} />
                          </label>
                        )}
                      </div>
                      
                      {/* Show active powerup clearly under player name */}
                      {activePowerup && (
                         <div className="mt-2 bg-orange-100 text-orange-900 text-xs font-bold p-2 rounded-lg border border-orange-200 flex items-start gap-2 shadow-inner">
                           <Zap size={14} className="fill-orange-500 text-orange-600 shrink-0 mt-0.5" />
                           <span className="leading-tight">Active: {activePowerup.powerup}</span>
                         </div>
                      )}

                    </div>
                  )})}
                </div>
              </div>
            )}

            {currentEvent.type === 'break' && (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                <Coffee size={56} className="text-emerald-400 mx-auto mb-4 drop-shadow-sm" />
                <h3 className="text-2xl font-black text-slate-700">Take a breather!</h3>
                <p className="text-slate-500 font-medium mt-2">Grab snacks, stretch those legs, check the score.</p>
              </div>
            )}

            {/* ACTION BUTTON */}
            <button 
              onClick={handleSaveResults}
              className={`w-full py-5 rounded-2xl font-black text-white text-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-3 ${currentEvent.type === 'break' ? 'bg-slate-800 hover:bg-slate-900' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <Check size={28} /> {currentEvent.type === 'break' ? 'End Break' : 'Save & Next Event'}
            </button>
          </div>
        </div>
      ) : (
        /* FINISHED SCREEN */
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center animate-in zoom-in duration-500">
          <Crown size={90} className="text-yellow-400 mx-auto mb-6 drop-shadow-md" />
          <h2 className="text-3xl font-black text-slate-800 mb-3 leading-tight">Olympics<br/>Complete!</h2>
          <p className="text-slate-500 font-medium mb-8">All events have been played. It's time to crown the champions.</p>
          <button 
            onClick={handleEndOlympics}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Trophy size={28}/> Crown Champions
          </button>
        </div>
      )}

      {/* SCHEDULE PREVIEW */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mt-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Schedule Overview</h3>
        <div className="space-y-1.5">
          {session.schedule.map((evt, idx) => (
            <div key={evt.instanceId} className={`flex items-center gap-3 p-2.5 rounded-xl text-sm transition-all ${idx < session.currentEventIndex ? 'opacity-40 grayscale' : idx === session.currentEventIndex ? 'bg-indigo-50 font-bold border border-indigo-100 shadow-sm scale-[1.02]' : 'bg-slate-50'}`}>
               <span className="w-5 text-center text-slate-400 font-bold text-xs">{idx + 1}</span>
               <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${evt.status === 'completed' ? 'bg-green-500' : idx === session.currentEventIndex ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
               <span className={`flex-1 font-semibold ${evt.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-700'}`}>{evt.name}</span>
               {evt.powerups?.length > 0 && idx >= session.currentEventIndex && <Zap size={14} className="text-orange-400 fill-orange-400/30" />}
            </div>
          ))}
        </div>
      </div>
      
      {!isFinished && (
        <button onClick={requestCancelSession} className="w-full text-center text-red-400 hover:text-red-600 text-xs font-black uppercase tracking-widest py-6 flex items-center justify-center gap-2 transition-colors">
          <ShieldAlert size={16}/> Abandon Session
        </button>
      )}

    </div>
  );
}

// --- MODALS ---

function PowerupModal({ data, onClose }) {
  const [displayPowerup, setDisplayPowerup] = useState('???');
  const [isSpinning, setIsSpinning] = useState(true);

  // Randomization Effect
  useEffect(() => {
    let interval;
    if (isSpinning) {
      interval = setInterval(() => {
        setDisplayPowerup(data.allPowerups[Math.floor(Math.random() * data.allPowerups.length)]);
      }, 80); // Fast spin

      setTimeout(() => {
        clearInterval(interval);
        setDisplayPowerup(data.finalPowerup);
        setIsSpinning(false);
      }, 2000); // Spin for 2 seconds
    }
    return () => clearInterval(interval);
  }, [data.allPowerups, data.finalPowerup, isSpinning]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <Zap size={72} className={`mx-auto mb-3 drop-shadow-lg relative z-10 ${isSpinning ? 'animate-pulse scale-110' : ''}`} />
          <h2 className="text-3xl font-black uppercase tracking-widest drop-shadow-md relative z-10">Power-Up!</h2>
          <p className="font-bold opacity-90 relative z-10 mt-1">{data.playerName}'s bonus for {data.eventName}</p>
        </div>
        
        <div className={`p-10 text-center transition-colors duration-500 ${isSpinning ? 'bg-slate-50' : 'bg-orange-50'}`}>
          <div className={`text-2xl font-black leading-snug transition-all duration-200 ${isSpinning ? 'text-slate-400 scale-95 blur-[1px]' : 'text-orange-900 scale-100 drop-shadow-sm'}`}>
            {isSpinning ? displayPowerup : `"${displayPowerup}"`}
          </div>
        </div>

        <div className="p-5 bg-white">
          <button 
            onClick={onClose} 
            disabled={isSpinning}
            className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 hover:bg-slate-900"
          >
            {isSpinning ? 'Selecting...' : "Let's Go!"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChampionModal({ data, onClose }) {
  const { pointsChamp, starsChamp } = data;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-around opacity-70">
         {[...Array(15)].map((_, i) => (
            <div key={i} className={`w-3 h-10 rounded-full bg-${['red','yellow','blue','green','purple','orange'][i%6]}-500 animate-[bounce_2s_ease-in-out_infinite]`} style={{animationDelay: `${i*0.15}s`, opacity: 0.8}}></div>
         ))}
      </div>

      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-75 duration-500 relative z-10 ring-4 ring-yellow-400/50">
        <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 p-10 text-center text-white relative">
          <Trophy size={90} className="mx-auto mb-4 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]" />
          <h2 className="text-xl font-black uppercase tracking-widest text-indigo-200 mb-2">Grand Champion</h2>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 drop-shadow-md pb-1">
            {pointsChamp?.name || "No Winner"}
          </div>
          <p className="mt-3 text-indigo-100 font-bold text-lg bg-black/20 inline-block px-4 py-1.5 rounded-full">{pointsChamp?.score || 0} pts • {pointsChamp?.totalGameWins || 0} wins</p>
        </div>
        
        {starsChamp && starsChamp.id !== pointsChamp?.id && (
          <div className="p-6 bg-slate-50 border-b border-slate-200 text-center shadow-inner">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Star Champion</h3>
            <div className="flex items-center justify-center gap-3">
              <Star size={32} className="fill-yellow-400 text-yellow-500 drop-shadow-sm" />
              <span className="text-3xl font-black text-slate-800">{starsChamp.name}</span>
            </div>
            <p className="text-sm font-bold text-slate-500 mt-2">{starsChamp.stars} challenge wins</p>
          </div>
        )}

        {starsChamp && starsChamp.id === pointsChamp?.id && (
          <div className="p-5 bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-100 text-center text-yellow-800 font-black text-sm flex items-center justify-center gap-2 border-y border-yellow-200">
            <Star size={18} className="fill-yellow-500 text-yellow-600" /> UNDISPUTED DOUBLE CHAMPION <Star size={18} className="fill-yellow-500 text-yellow-600" />
          </div>
        )}

        <div className="p-6 bg-white">
          <button onClick={onClose} className="w-full bg-slate-100 text-slate-800 py-4 rounded-2xl font-black text-lg active:scale-95 transition-all hover:bg-slate-200">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ data, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black text-slate-800 mb-2">{data.title}</h3>
        <p className="text-slate-600 font-medium mb-6 leading-relaxed">{data.message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { data.onConfirm(); onClose(); }} 
            className={`flex-1 font-bold py-3 rounded-xl text-white transition-colors shadow-sm ${data.confirmStyle === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {data.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}