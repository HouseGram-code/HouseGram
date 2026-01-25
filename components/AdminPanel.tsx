
import React, { useState } from 'react';
import { 
  ArrowLeft, ShieldAlert, Users, Activity, Terminal, 
  Search, Lock, Unlock, RefreshCw, BarChart2, HardDrive
} from 'lucide-react';
import { User } from '../types.ts';

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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Total Users" value={users.length} icon={<Users className="text-blue-500" />} />
                        <StatCard label="Banned Users" value={bannedUserIds.size} icon={<Lock className="text-red-500" />} />
                        <StatCard label="Server Load" value="12%" icon={<Activity className="text-green-500" />} />
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center"><HardDrive className="mr-2 text-purple-500" /> Storage Usage</h3>
                        <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 w-[35%] animate-pulse" />
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-400">
                            <span>1.4 TB Used</span>
                            <span>4.0 TB Total</span>
                        </div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center"><BarChart2 className="mr-2 text-yellow-500" /> Traffic Spike</h3>
                        <div className="h-40 flex items-end space-x-2">
                            {[40, 60, 45, 70, 30, 80, 50, 90, 65, 40, 55, 75].map((h, i) => (
                                <div key={i} className="flex-1 bg-yellow-500/50 hover:bg-yellow-500 transition-colors rounded-t" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="animate-fadeIn">
                    <div className="flex items-center space-x-4 mb-6 bg-white/5 p-3 rounded-lg border border-white/10">
                        <Search className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search user by name or email..." 
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
                                        <p className="font-bold">{user.name}</p>
                                        <p className="text-sm text-gray-400">{user.email || 'No Email'}</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">ID: {user.id}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${bannedUserIds.has(user.id) ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                        {bannedUserIds.has(user.id) ? 'BANNED' : 'ACTIVE'}
                                    </div>
                                    <button 
                                        onClick={() => bannedUserIds.has(user.id) ? onUnbanUser(user.id) : onBanUser(user.id)}
                                        className={`p-2 rounded-lg transition-colors ${bannedUserIds.has(user.id) ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {bannedUserIds.has(user.id) ? <Unlock size={18} /> : <Lock size={18} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-black border border-white/10 rounded-lg p-4 font-mono text-sm h-full overflow-y-auto animate-fadeIn text-green-500">
                    <p className="mb-1 opacity-70">[SYSTEM] Initializing Admin Protocol v9.0...</p>
                    <p className="mb-1 opacity-70">[SYSTEM] Connection established to Mesh Network.</p>
                    <p className="mb-1 opacity-70">[AUTH] Admin user 'goh' authenticated via secure channel.</p>
                    <p className="mb-1 text-yellow-500">[WARN] High latency detected on Node #442.</p>
                    <p className="mb-1 opacity-70">[INFO] User database synced. {users.length} records loaded.</p>
                    <p className="mb-1 opacity-70">[INFO] Storage integrity check passed.</p>
                    <p className="mb-1 text-blue-400">[NET] Incoming packet stream: OK.</p>
                    {Array.from(bannedUserIds).map(id => (
                        <p key={id} className="mb-1 text-red-500">[ACTION] Ban enforcement active for user_id: {id}</p>
                    ))}
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
