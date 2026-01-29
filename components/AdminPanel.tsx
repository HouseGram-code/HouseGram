
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, Users, Activity, Terminal, Search, Lock, Unlock, Zap, Server, Send, Snowflake, Construction, RefreshCw, Star, Globe } from 'lucide-react';
import { User } from '../types.ts';
import { db } from '../firebase.ts';
import { doc, updateDoc, collection, onSnapshot, setDoc } from 'firebase/firestore';
import { API_URL } from '../constants.ts';

interface AdminPanelProps {
  onBack: () => void;
  users: User[];
  bannedUserIds: Set<string>;
  onBanUser: (userId: string) => void;
  onUnbanUser: (userId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, users: initialUsers, bannedUserIds, onBanUser, onUnbanUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'system' | 'broadcast'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [grantAmount, setGrantAmount] = useState('100');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  
  const [snowEnabled, setSnowEnabled] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        setUsers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    });
    const unsubSystem = onSnapshot(doc(db, "system", "settings"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setSnowEnabled(data.snowEnabled || false);
            setMaintenanceMode(data.maintenanceMode || false);
        }
    });
    return () => { unsubUsers(); unsubSystem(); };
  }, []);

  const handleGrant = async (user: User) => {
    const amount = parseInt(grantAmount);
    if (isNaN(amount)) return;
    await updateDoc(doc(db, "users", user.id), { zippers: (user.zippers || 0) + amount });
    alert(`Granted ${amount} Zippers to ${user.name}`);
  };

  const handleToggleSystem = async (key: string, value: boolean) => {
      await setDoc(doc(db, "system", "settings"), { [key]: value }, { merge: true });
  };

  const handleBroadcast = async () => {
      if (!broadcastMsg.trim()) return;
      if (!window.confirm(`Send broadcast to ${users.length} users?`)) return;
      
      await setDoc(doc(db, "system", "broadcast"), {
          text: broadcastMsg,
          timestamp: Date.now(),
          sender: "HouseGram Cloud"
      });
      alert("Broadcast executed!");
      setBroadcastMsg('');
  };

  const toggleStatus = async (user: User, key: string, value: boolean) => {
      await updateDoc(doc(db, "users", user.id), { [key]: value });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#0E1621] text-white animate-fadeIn">
      <div className="z-20 bg-[#17212B] px-4 py-4 flex items-center justify-between border-b border-white/5 shadow-xl">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"><ArrowLeft size={24} /></button>
            <span className="text-white font-black text-xl ml-4 tracking-tighter flex items-center">
                <ShieldAlert size={22} className="mr-2 text-red-500 animate-pulse" /> ROOT@SYSTEM:~#
            </span>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${maintenanceMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-green-500/10 border-green-500/50 text-green-500'}`}>
            <div className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-amber-500 animate-pulse' : 'bg-green-500 animate-ping'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{maintenanceMode ? 'MAINTENANCE_ACTIVE' : 'LIVE_SERVICE'}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-16 md:w-64 bg-[#17212B] border-r border-white/5 flex flex-col pt-4 overflow-y-auto no-scrollbar">
            <SidebarBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity size={20}/>} label="Dashboard" />
            <SidebarBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20}/>} label="User Control" />
            <SidebarBtn active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<Server size={20}/>} label="System Config" />
            <SidebarBtn active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast'} icon={<Send size={20}/>} label="Broadcast" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-[#0E1621]">
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Live Users" value={users.length} icon={<Users className="text-blue-400" />} />
                        <StatCard label="Security Bans" value={bannedUserIds.size} icon={<Lock className="text-red-400" />} />
                        <StatCard label="Maintenance" value={maintenanceMode ? "ACTIVE" : "OFF"} icon={<Construction className={maintenanceMode ? "text-amber-500" : "text-gray-500"} />} />
                    </div>
                    
                    <div className="bg-[#17212B] p-6 rounded-2xl border border-white/5 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center font-mono uppercase tracking-widest text-tg-accent"><Terminal size={18} className="mr-2"/> System Console</h3>
                        <div className="bg-black/50 p-6 rounded-2xl font-mono text-[11px] text-green-500/90 space-y-1.5 h-72 overflow-y-auto border border-white/5 shadow-inner">
                            <p className="opacity-50">[{new Date().toLocaleTimeString()}] Establishing link with Firebase Cloud...</p>
                            <p>[SUCCESS] Auth handshake confirmed.</p>
                            <p>[INFO] Monitoring 24/7 endpoint: {API_URL}</p>
                            {maintenanceMode && <p className="text-amber-500 font-bold animate-pulse">!!! ALERT: SYSTEM IS IN MAINTENANCE MODE. PUBLIC ACCESS DENIED !!!</p>}
                            <p className="text-white/20">----------------------------------------------------</p>
                            <p className="text-tg-accent">READY FOR ADMIN COMMANDS_</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="max-w-2xl space-y-8 animate-fadeIn">
                    <div className="flex flex-col space-y-2 mb-4">
                        <h2 className="text-3xl font-black text-white tracking-tight">System Configuration</h2>
                        <p className="text-tg-secondary">Global controls to manage platform visibility and features.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <SystemToggle 
                            icon={<Construction className={`${maintenanceMode ? 'text-amber-500' : 'text-gray-500'} transition-colors`} />} 
                            label="Site Lockdown (Maintenance)" 
                            desc="Close the site for all regular users. Shows the WhatsApp Evolution screen." 
                            active={maintenanceMode} 
                            onClick={() => handleToggleSystem('maintenanceMode', !maintenanceMode)}
                            warning={maintenanceMode}
                        />
                        <SystemToggle 
                            icon={<Snowflake className={`${snowEnabled ? 'text-blue-400' : 'text-gray-500'} transition-colors`} />} 
                            label="Winter Vibes (Snow)" 
                            desc="Enable beautiful snow particles for every visitor." 
                            active={snowEnabled} 
                            onClick={() => handleToggleSystem('snowEnabled', !snowEnabled)}
                        />
                        <SystemToggle 
                            icon={<Globe className="text-gray-500" />} 
                            label="Public Registration" 
                            desc="Allow new users to sign up via the auth screen." 
                            active={true} 
                            onClick={() => alert("Feature coming soon")}
                        />
                    </div>

                    <div className="p-8 bg-red-500/5 rounded-[32px] border border-red-500/10 mt-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />
                        <h4 className="text-red-500 font-black text-lg mb-2 flex items-center uppercase tracking-widest"><RefreshCw size={18} className="mr-2"/> Danger Operations</h4>
                        <p className="text-gray-400 text-sm mb-6">These actions affect the core system stability and database integrity.</p>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Flush User Sessions</button>
                            <button className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Reset Sync Clock</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1 flex items-center bg-[#17212B] p-4 rounded-2xl border border-white/5 shadow-sm focus-within:border-tg-accent transition-colors">
                            <Search className="text-gray-500 mr-3" size={20} />
                            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, username or ID..." className="bg-transparent outline-none w-full text-white"/>
                        </div>
                    </div>

                    <div className="bg-[#17212B] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]">
                                <tr>
                                    <th className="p-6 whitespace-nowrap">Identity</th>
                                    <th className="p-6 whitespace-nowrap">Assets</th>
                                    <th className="p-6 whitespace-nowrap">Status</th>
                                    <th className="p-6 text-right whitespace-nowrap">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-all group">
                                        <td className="p-6 flex items-center space-x-4">
                                            <div className={`w-12 h-12 rounded-2xl ${u.avatarColor} flex items-center justify-center font-bold text-lg shrink-0 shadow-lg`}>
                                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-2xl" /> : u.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-white truncate flex items-center">
                                                    {u.name} 
                                                    {u.isAdmin && <ShieldAlert size={14} className="ml-2 text-red-500" fill="currentColor" />}
                                                </div>
                                                <div className="text-[11px] text-gray-500 font-mono">ID: {u.id.slice(0, 8)}...</div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-amber-400 font-mono font-bold whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                <span>{u.zippers || 0}</span>
                                                <Zap size={12} fill="currentColor" />
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex gap-1.5">
                                                <BadgeToggle label="ROOT" active={u.isAdmin} onClick={() => {}} color="red" />
                                                <BadgeToggle label="OFFIC" active={u.isOfficial} onClick={() => toggleStatus(u, 'isOfficial', !u.isOfficial)} color="blue" />
                                            </div>
                                        </td>
                                        <td className="p-6 text-right space-x-2 whitespace-nowrap">
                                            <button onClick={() => handleGrant(u)} className="p-3 bg-white/5 hover:bg-amber-500/20 rounded-2xl text-amber-500 transition-all active:scale-90" title="Grant Cash"><Zap size={18} /></button>
                                            <button onClick={() => bannedUserIds.has(u.id) ? onUnbanUser(u.id) : onBanUser(u.id)} className={`p-3 bg-white/5 rounded-2xl transition-all active:scale-90 ${bannedUserIds.has(u.id) ? 'text-green-500 hover:bg-green-500/20' : 'text-red-500 hover:bg-red-500/20'}`}>
                                                {bannedUserIds.has(u.id) ? <Unlock size={18}/> : <Lock size={18}/>}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'broadcast' && (
                <div className="max-w-2xl space-y-6 animate-fadeIn">
                    <h2 className="text-3xl font-black text-white tracking-tight">Cloud Broadcast</h2>
                    <div className="bg-[#17212B] p-8 rounded-[32px] border border-white/5 space-y-6 shadow-2xl">
                        <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 flex items-start space-x-4">
                            <Activity size={20} className="text-blue-400 mt-0.5" />
                            <p className="text-blue-200/80 text-sm leading-relaxed">Сигнал будет доставлен всем активным пользователям мгновенно. Используйте для важных объявлений.</p>
                        </div>
                        <textarea 
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                            rows={8}
                            placeholder="Type your global message here..."
                            className="w-full bg-black/30 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-tg-accent transition-all resize-none font-mono text-sm shadow-inner"
                        />
                        <button 
                            onClick={handleBroadcast}
                            className="w-full py-5 bg-tg-accent rounded-2xl text-white font-black flex items-center justify-center space-x-4 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(42,171,238,0.3)]"
                        >
                            <Send size={22} />
                            <span className="text-lg uppercase tracking-widest">Transmit Signal</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const SidebarBtn = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`flex items-center space-x-4 px-6 py-5 transition-all w-full relative group ${active ? 'text-tg-accent font-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-tg-accent rounded-r-full shadow-[0_0_15px_rgba(42,171,238,0.5)]" />}
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
        <span className="hidden md:inline text-[13px] uppercase tracking-[0.15em]">{label}</span>
    </button>
);

const StatCard = ({ label, value, icon }: any) => (
    <div className="bg-[#17212B] p-8 rounded-[32px] border border-white/5 shadow-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
        <div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</p>
            <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
        </div>
        <div className="p-5 bg-black/30 rounded-3xl border border-white/5 group-hover:scale-110 transition-transform">{icon}</div>
    </div>
);

const BadgeToggle = ({ label, active, onClick, color }: any) => (
    <button onClick={onClick} className={`text-[9px] font-black px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap tracking-widest ${active ? `bg-${color}-500 text-white border-${color}-400 shadow-lg shadow-${color}-500/20` : 'bg-transparent text-gray-700 border-white/5'}`}>{label}</button>
);

const SystemToggle = ({ icon, label, desc, active, onClick, warning }: any) => (
    <div className={`flex items-center justify-between bg-[#17212B] p-8 rounded-[32px] border transition-all ${active && warning ? 'border-amber-500/30' : 'border-white/5'}`}>
        <div className="flex items-center space-x-6">
            <div className={`p-4 rounded-3xl bg-black/40 shadow-inner ${active && warning ? 'text-amber-500' : 'text-gray-400'}`}>{icon}</div>
            <div>
                <h4 className="font-black text-white text-lg tracking-tight">{label}</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1">{desc}</p>
            </div>
        </div>
        <button onClick={onClick} className={`w-16 h-9 rounded-full p-1.5 transition-all duration-500 relative shadow-inner ${active ? (warning ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-tg-accent shadow-[0_0_20px_rgba(42,171,238,0.3)]') : 'bg-[#1c2733]'}`}>
            <div className={`w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-500 ${active ? 'translate-x-7' : 'translate-x-0'}`} />
        </button>
    </div>
);

export default AdminPanel;
