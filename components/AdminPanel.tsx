
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, Users, Activity, Terminal, Search, Lock, Unlock, Zap, Server, Send, Snowflake, Construction, RefreshCw, Star } from 'lucide-react';
import { User } from '../types.ts';
import { db } from '../firebase.ts';
import { doc, updateDoc, collection, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
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
      
      // Store broadcast in a special collection that clients listen to
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
    <div className="flex flex-col h-full w-full bg-[#0E1621] text-white">
      <div className="z-20 bg-[#17212B] px-4 py-4 flex items-center justify-between border-b border-white/5 shadow-xl">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"><ArrowLeft size={24} /></button>
            <span className="text-white font-black text-xl ml-4 tracking-tighter flex items-center">
                <ShieldAlert size={22} className="mr-2 text-red-500 animate-pulse" /> ROOT@HOUSEGRAM:~#
            </span>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-xs font-mono">NODE_ONLINE</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-16 md:w-64 bg-[#17212B] border-r border-white/5 flex flex-col pt-4 overflow-y-auto no-scrollbar">
            <SidebarBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity size={20}/>} label="Dashboard" />
            <SidebarBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20}/>} label="User Control" />
            <SidebarBtn active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<Server size={20}/>} label="System Config" />
            <SidebarBtn active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} icon={<Send size={20}/>} label="Broadcast" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Live Users" value={users.length} icon={<Users className="text-blue-400" />} />
                        <StatCard label="Security Bans" value={bannedUserIds.size} icon={<Lock className="text-red-400" />} />
                        <StatCard label="Zippers Circulating" value={users.reduce((acc, u) => acc + (u.zippers || 0), 0)} icon={<Zap className="text-amber-400" />} />
                    </div>
                    
                    <div className="bg-[#17212B] p-6 rounded-2xl border border-white/5 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center"><Terminal size={18} className="mr-2 text-tg-accent"/> Kernel Logs</h3>
                        <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-green-500/80 space-y-1 h-64 overflow-y-auto border border-white/5">
                            <p>[{new Date().toLocaleTimeString()}] Handshaking with Firebase...</p>
                            <p>[OK] Auth pool synced.</p>
                            <p>[OK] Mesh API heartbeat active at {API_URL}</p>
                            <p className="text-amber-500">[WARN] High traffic detected.</p>
                            <p className="text-tg-accent">[CMD] Admin console listening.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1 flex items-center bg-[#17212B] p-4 rounded-2xl border border-white/5">
                            <Search className="text-gray-500 mr-3" size={20} />
                            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search UID, Name, Username..." className="bg-transparent outline-none w-full text-white"/>
                        </div>
                        <div className="hidden md:flex items-center bg-[#17212B] px-4 rounded-2xl border border-white/5">
                            <Star size={18} className="text-amber-400 mr-2"/>
                            <input type="number" value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} className="w-20 bg-transparent py-4 text-white outline-none" placeholder="100"/>
                        </div>
                    </div>

                    <div className="bg-[#17212B] rounded-2xl border border-white/5 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="p-5 whitespace-nowrap">User</th>
                                    <th className="p-5 whitespace-nowrap">Balance</th>
                                    <th className="p-5 whitespace-nowrap">Badges</th>
                                    <th className="p-5 text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-all">
                                        <td className="p-5 flex items-center space-x-4">
                                            <div className={`w-10 h-10 rounded-full ${u.avatarColor} flex items-center justify-center font-bold text-sm shrink-0`}>
                                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-full" /> : u.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-white truncate">{u.name} {u.isAdmin && <ShieldAlert size={12} className="inline ml-1 text-red-500" />}</div>
                                                <div className="text-[11px] text-gray-500 truncate">@{u.username}</div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-amber-400 font-mono font-bold whitespace-nowrap">{u.zippers || 0}</td>
                                        <td className="p-5">
                                            <div className="flex gap-1">
                                                <BadgeToggle label="TEST" active={u.isTester} onClick={() => toggleStatus(u, 'isTester', !u.isTester)} color="purple" />
                                                <BadgeToggle label="OFFICIAL" active={u.isOfficial} onClick={() => toggleStatus(u, 'isOfficial', !u.isOfficial)} color="blue" />
                                            </div>
                                        </td>
                                        <td className="p-5 text-right space-x-1 whitespace-nowrap">
                                            <button onClick={() => handleGrant(u)} className="p-2 hover:bg-amber-500/20 rounded-xl text-amber-500" title="Grant Currency"><Zap size={16} /></button>
                                            <button onClick={() => bannedUserIds.has(u.id) ? onUnbanUser(u.id) : onBanUser(u.id)} className={`p-2 hover:bg-white/10 rounded-xl transition-colors ${bannedUserIds.has(u.id) ? 'text-green-500' : 'text-red-500'}`}>
                                                {bannedUserIds.has(u.id) ? <Unlock size={16}/> : <Lock size={16}/>}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="max-w-2xl space-y-6 animate-fadeIn">
                    <h2 className="text-2xl font-black mb-8">System Configuration</h2>
                    <SystemToggle 
                        icon={<Snowflake className="text-blue-400"/>} 
                        label="Global Snow Effect" 
                        desc="Activate winter theme for all users instantly." 
                        active={snowEnabled} 
                        onClick={() => handleToggleSystem('snowEnabled', !snowEnabled)}
                    />
                    <SystemToggle 
                        icon={<Construction className="text-amber-500"/>} 
                        label="Maintenance Mode" 
                        desc="Block non-admin users from using the app." 
                        active={maintenanceMode} 
                        onClick={() => handleToggleSystem('maintenanceMode', !maintenanceMode)}
                    />
                    <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/20 mt-12">
                        <h4 className="text-red-500 font-bold mb-2 flex items-center"><RefreshCw size={16} className="mr-2"/> Danger Zone</h4>
                        <p className="text-gray-400 text-sm mb-4">Rebooting system pool will disconnect all active sessions.</p>
                        <button className="px-4 py-2 bg-red-500 rounded-lg text-white text-xs font-bold hover:bg-red-600 transition-colors">FLUSH SYSTEM POOL</button>
                    </div>
                </div>
            )}

            {activeTab === 'broadcast' && (
                <div className="max-w-2xl space-y-6 animate-fadeIn">
                    <h2 className="text-2xl font-black mb-8">Cloud Broadcast</h2>
                    <div className="bg-[#17212B] p-6 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-gray-400 text-sm">Send a message that will appear in every user's notification system.</p>
                        <textarea 
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                            rows={6}
                            placeholder="Enter announcement text..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-tg-accent transition-colors resize-none font-mono text-sm"
                        />
                        <button 
                            onClick={handleBroadcast}
                            className="w-full py-4 bg-tg-accent rounded-xl text-white font-black flex items-center justify-center space-x-3 hover:brightness-110 shadow-lg"
                        >
                            <Send size={20} />
                            <span>SEND SIGNAL</span>
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
    <button onClick={onClick} className={`flex items-center space-x-4 px-6 py-4 transition-all w-full ${active ? 'text-tg-accent bg-tg-accent/5 border-r-4 border-tg-accent font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
        {icon}
        <span className="hidden md:inline text-sm">{label}</span>
    </button>
);

const StatCard = ({ label, value, icon }: any) => (
    <div className="bg-[#17212B] p-6 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between">
        <div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
        </div>
        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">{icon}</div>
    </div>
);

const BadgeToggle = ({ label, active, onClick, color }: any) => (
    <button onClick={onClick} className={`text-[9px] font-black px-2 py-1 rounded border transition-all whitespace-nowrap ${active ? `bg-${color}-500 text-white border-${color}-400` : 'bg-transparent text-gray-600 border-gray-800'}`}>{label}</button>
);

const SystemToggle = ({ icon, label, desc, active, onClick }: any) => (
    <div className="flex items-center justify-between bg-[#17212B] p-6 rounded-2xl border border-white/5">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-black/20 rounded-xl">{icon}</div>
            <div>
                <h4 className="font-bold text-white text-sm md:text-base">{label}</h4>
                <p className="text-xs text-gray-500">{desc}</p>
            </div>
        </div>
        <button onClick={onClick} className={`w-12 h-7 md:w-14 md:h-8 rounded-full p-1 transition-colors duration-300 relative ${active ? 'bg-tg-accent' : 'bg-gray-800'}`}>
            <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${active ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);

export default AdminPanel;
