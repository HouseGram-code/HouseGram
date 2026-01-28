
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ShieldAlert, Users, Activity, Terminal, 
  Search, Lock, Unlock, RefreshCw, BarChart2, HardDrive,
  Snowflake, Construction, Gift, Zap, CheckCircle, FlaskConical
} from 'lucide-react';
import { User, Gift as GiftType } from '../types.ts';
import { db } from '../firebase.ts';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

interface AdminPanelProps {
  onBack: () => void;
  users: User[];
  bannedUserIds: Set<string>;
  onBanUser: (userId: string) => void;
  onUnbanUser: (userId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onBack, users, bannedUserIds, onBanUser, onUnbanUser 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'logs'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [snowEnabled, setSnowEnabled] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Quick Grant State
  const [targetUsername, setTargetUsername] = useState('');
  const [grantAmount, setGrantAmount] = useState<string>('100');

  // Tester Grant State
  const [testerTargetUsername, setTesterTargetUsername] = useState('');

  // Listen to global settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'settings'), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setSnowEnabled(data?.snowEnabled || false);
            setMaintenanceMode(data?.maintenanceMode || false);
        }
    });
    return () => unsub();
  }, []);

  const toggleSnow = async () => {
      const newState = !snowEnabled;
      setSnowEnabled(newState);
      await setDoc(doc(db, 'system', 'settings'), { snowEnabled: newState }, { merge: true });
  };

  const toggleMaintenance = async () => {
      const newState = !maintenanceMode;
      setMaintenanceMode(newState);
      await setDoc(doc(db, 'system', 'settings'), { maintenanceMode: newState }, { merge: true });
  };

  const handleGrantGift = async (userId: string) => {
      // Grant the "Teddy Bear" for testing
      const gift: GiftType = { 
          id: 'g_bear_admin', 
          name: 'Admin Bear', 
          price: 999, 
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/4255/4255288.png', 
          backgroundColor: '#3F2E23' 
      };
      
      try {
          await updateDoc(doc(db, "users", userId), {
              gifts: arrayUnion(gift)
          });
          alert("Admin Bear Gift granted!");
      } catch (e) {
          console.error("Failed to grant gift", e);
      }
  };

  const handleGrantZippersToUser = async (user: User) => {
      let amount = parseInt(grantAmount);
      if (isNaN(amount) || amount <= 0) {
          amount = 100; // Force default if invalid
          setGrantAmount('100');
      }

      try {
          const current = user.zippers || 0;
          await updateDoc(doc(db, "users", user.id), {
              zippers: current + amount
          });
          console.log(`Granted ${amount} Zippers to ${user.name}`);
      } catch (e) {
          console.error("Error granting zippers", e);
      }
  };

  const handleGrantByTargetUsername = async () => {
      if (!targetUsername.trim()) {
          alert("Please enter a username.");
          return;
      }
      
      const cleanUsername = targetUsername.trim().replace('@', '').toLowerCase();
      
      // Find user in the local users array (which contains all users for admin)
      const targetUser = users.find(u => (u.username || '').replace('@', '').toLowerCase() === cleanUsername);
      
      if (!targetUser) {
          alert("User not found in loaded database!");
          return;
      }
      
      await handleGrantZippersToUser(targetUser);
      alert(`Successfully sent zippers to @${cleanUsername}`);
      setTargetUsername(''); // Clear after success
  };

  const handleToggleTesterByUsername = async () => {
    if (!testerTargetUsername.trim()) {
        alert("Please enter a username.");
        return;
    }
    
    const cleanUsername = testerTargetUsername.trim().replace('@', '').toLowerCase();
    const targetUser = users.find(u => (u.username || '').replace('@', '').toLowerCase() === cleanUsername);
    
    if (!targetUser) {
        alert("User not found in loaded database!");
        return;
    }

    try {
        await updateDoc(doc(db, "users", targetUser.id), {
            isTester: !targetUser.isTester
        });
        alert(`Successfully ${!targetUser.isTester ? 'granted' : 'revoked'} Tester status for @${cleanUsername}`);
        setTesterTargetUsername('');
    } catch (e) {
        console.error("Error toggling tester status", e);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-white overflow-hidden relative font-mono">
      {/* Admin Header */}
      <div className="z-20 bg-red-900/20 px-4 py-3 flex items-center border-b border-red-500/30">
        <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-colors active:scale-90">
          <ArrowLeft size={24} />
        </button>
        <span className="text-red-500 font-bold text-xl ml-4 tracking-wider flex items-center">
            <ShieldAlert size={24} className="mr-2" />
            GOD MODE_
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-16 md:w-64 bg-black border-r border-white/10 flex flex-col">
            <AdminTab 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                icon={<Activity size={20} />} 
                label="Dashboard" 
            />
            <AdminTab 
                active={activeTab === 'users'} 
                onClick={() => setActiveTab('users')} 
                icon={<Users size={20} />} 
                label="User Database" 
            />
            <AdminTab 
                active={activeTab === 'logs'} 
                onClick={() => setActiveTab('logs')} 
                icon={<Terminal size={20} />} 
                label="System Logs" 
            />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6">
            
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center text-white"><Activity className="mr-2 text-blue-500" /> Global Effects</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${snowEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
                                        <Snowflake size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold">Winter Protocol</p>
                                        <p className="text-sm text-gray-400">Enable falling snow.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={toggleSnow}
                                    className={`px-4 py-2 rounded font-bold text-sm transition-all ${snowEnabled ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-white/10 hover:bg-white/20 text-gray-400'}`}
                                >
                                    {snowEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center text-white"><HardDrive className="mr-2 text-orange-500" /> System Control</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${maintenanceMode ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-500'}`}>
                                        <Construction size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold">Maintenance Mode</p>
                                        <p className="text-sm text-gray-400">Lock app for non-admins.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={toggleMaintenance}
                                    className={`px-4 py-2 rounded font-bold text-sm transition-all ${maintenanceMode ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] animate-pulse' : 'bg-white/10 hover:bg-white/20 text-gray-400'}`}
                                >
                                    {maintenanceMode ? 'ACTIVE' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Total Users" value={users.length} icon={<Users className="text-blue-500" />} />
                        <StatCard label="Banned Users" value={bannedUserIds.size} icon={<Lock className="text-red-500" />} />
                        <StatCard label="Server Load" value="12%" icon={<Activity className="text-green-500" />} />
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="animate-fadeIn space-y-6">
                    {/* Quick Issue Tool - Zippers */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-lg flex flex-col md:flex-row items-end md:items-center gap-4">
                        <div className="flex-1 w-full">
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Issue Zippers - Username</label>
                            <div className="flex items-center bg-black/30 rounded-lg px-3 border border-white/10">
                                <span className="text-gray-400">@</span>
                                <input 
                                    type="text" 
                                    value={targetUsername}
                                    onChange={(e) => setTargetUsername(e.target.value)}
                                    placeholder="username"
                                    className="bg-transparent border-none outline-none text-white w-full py-2 font-mono"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-32">
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Amount</label>
                            <input 
                                type="number" 
                                value={grantAmount}
                                onChange={(e) => setGrantAmount(e.target.value)}
                                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white w-full font-mono focus:border-amber-500/50 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleGrantByTargetUsername}
                            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors h-[42px]"
                        >
                            <Zap size={18} fill="black" />
                            <span>Issue Now</span>
                        </button>
                    </div>

                    {/* Quick Issue Tool - Tester Badge */}
                    <div className="bg-white/5 border border-white/10 p-5 rounded-lg flex flex-col md:flex-row items-end md:items-center gap-4">
                        <div className="flex-1 w-full">
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Toggle Tester Status - Username</label>
                            <div className="flex items-center bg-black/30 rounded-lg px-3 border border-white/10">
                                <span className="text-gray-400">@</span>
                                <input 
                                    type="text" 
                                    value={testerTargetUsername}
                                    onChange={(e) => setTesterTargetUsername(e.target.value)}
                                    placeholder="username"
                                    className="bg-transparent border-none outline-none text-white w-full py-2 font-mono"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleToggleTesterByUsername}
                            className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors h-[42px]"
                        >
                            <FlaskConical size={18} />
                            <span>Toggle Status</span>
                        </button>
                    </div>

                    {/* Search & List */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 bg-white/5 p-3 rounded-lg border border-white/10">
                            <Search className="text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Filter users list..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-white w-full font-mono"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            {filteredUsers.map(user => (
                                <div key={user.id} className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-center justify-between hover:bg-white/10 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 rounded-full ${user.avatarColor} flex items-center justify-center font-bold`}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold flex items-center">
                                                {user.name} 
                                                <span className="text-gray-500 text-xs ml-2 font-normal">@{user.username?.replace('@', '')}</span>
                                                {user.isTester && <FlaskConical size={14} className="ml-2 text-purple-400" />}
                                            </p>
                                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                                                ID: {user.id.slice(0, 8)}... 
                                                <span className="text-amber-500 font-bold flex items-center gap-1">
                                                    <Zap size={12} fill="currentColor" /> 
                                                    {user.zippers || 0}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleGrantZippersToUser(user)}
                                            className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors border border-amber-500/20 group relative"
                                            title={`Grant ${grantAmount || 100} Zippers`}
                                        >
                                            <Zap size={18} className="group-hover:fill-current" />
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Give {grantAmount || 100}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleGrantGift(user.id)}
                                            className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 transition-colors border border-purple-500/20"
                                            title="Grant Bear"
                                        >
                                            <Gift size={18} />
                                        </button>
                                        <button 
                                            onClick={() => bannedUserIds.has(user.id) ? onUnbanUser(user.id) : onBanUser(user.id)}
                                            className={`p-2 rounded-lg transition-colors border ${bannedUserIds.has(user.id) ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                                        >
                                            {bannedUserIds.has(user.id) ? <Unlock size={18} /> : <Lock size={18} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-black border border-white/10 rounded-lg p-4 font-mono text-sm h-full overflow-y-auto animate-fadeIn text-green-500">
                    <p className="mb-1 opacity-70">[SYSTEM] Initializing Admin Protocol v9.0...</p>
                    <p className="mb-1 opacity-70">[SYSTEM] Connection established to Mesh Network.</p>
                    <p className="mb-1 opacity-70">[AUTH] Admin user authenticated via secure channel.</p>
                    {maintenanceMode && <p className="mb-1 text-orange-500">[WARN] SYSTEM LOCKED. MAINTENANCE MODE ACTIVE.</p>}
                    {snowEnabled && <p className="mb-1 text-blue-400">[EFFECT] Winter Protocol Active. Global snowfall deployed.</p>}
                    <p className="mb-1 opacity-70">[INFO] User database synced. {users.length} records loaded.</p>
                    <div className="animate-pulse mt-2">_</div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

const AdminTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex items-center space-x-3 px-4 py-4 w-full transition-all border-l-4 ${
            active 
            ? 'bg-white/10 border-red-500 text-white' 
            : 'border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
        }`}
    >
        {icon}
        <span className="hidden md:inline font-medium tracking-wide">{label}</span>
    </button>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-white/5 border border-white/10 p-6 rounded-lg flex items-center justify-between">
        <div>
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="p-3 bg-white/5 rounded-full">
            {icon}
        </div>
    </div>
);

export default AdminPanel;