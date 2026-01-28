
import React, { useState, useEffect } from 'react';
import { 
  Users, Megaphone, User, Phone, Bookmark, 
  Settings, UserPlus, ShieldAlert, Lock, Moon, Sun
} from 'lucide-react';
import { User as UserType } from '../types.ts';
import { useLanguage } from '../LanguageContext.tsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenAdmin?: () => void;
  onOpenSavedMessages: () => void;
  currentUser: UserType;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenProfile, onOpenAdmin, onOpenSavedMessages, currentUser }) => {
  const { t } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const isAdmin = currentUser.email?.toLowerCase() === 'goh@gmail.com';

  const updateMetaThemeColor = (theme: string) => {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
          meta.setAttribute('content', theme === 'dark' ? '#0E1621' : '#FFFFFF');
      }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('hg_theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateMetaThemeColor(savedTheme);
    } else {
      setIsDarkMode(true); 
      document.documentElement.setAttribute('data-theme', 'dark');
      updateMetaThemeColor('dark');
    }
  }, []);

  const toggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    const theme = newMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hg_theme', theme);
    updateMetaThemeColor(theme);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed inset-y-0 left-0 w-[280px] bg-tg-sidebar z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl flex flex-col h-full border-r border-black/5 dark:border-white/5`}>
        
        {/* Profile Header */}
        <div 
          onClick={onOpenProfile} 
          className="relative min-h-[160px] bg-[#1c242f] px-6 pt-safe pb-6 flex flex-col justify-end cursor-pointer group hover:bg-[#232c3a] transition-colors shrink-0 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-tg-accent/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col space-y-3 mt-4">
            <div className="flex justify-between items-start">
              <div className="relative inline-block">
                {currentUser.avatarUrl ? (
                  currentUser.isVideoAvatar ? (
                     <video src={currentUser.avatarUrl} autoPlay loop muted playsInline className="w-[60px] h-[60px] rounded-full object-cover border-2 border-white/10 shadow-md" />
                  ) : (
                     <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-white/10 shadow-md" />
                  )
                ) : (
                  <div className={`w-[60px] h-[60px] rounded-full ${currentUser.avatarColor} border-2 border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-md`}>
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-tg-online border-[2.5px] border-[#1c242f] rounded-full" />
              </div>

              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white active:scale-95"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} fill="currentColor" />}
              </button>
            </div>

            <div className="flex flex-col">
              <span className="text-white font-bold text-[16px] tracking-wide group-hover:text-tg-accent transition-colors">
                {currentUser.name}
              </span>
              <span className="text-tg-secondary text-[13px] font-medium truncate">
                {currentUser.phone || currentUser.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-2 pb-safe bg-tg-sidebar">
          
          <MenuItem 
            icon={<Users size={24} />} 
            label={t('createGroup')} 
            badge={<Badge text={t('soon')} />}
          />
          <MenuItem 
            icon={<Megaphone size={24} />} 
            label={t('createChannel')} 
            badge={<Badge text={t('soon')} />}
          />
          
          <div className="my-2 border-b border-black/5 dark:border-white/5 mx-4" />
          
          <MenuItem 
            icon={<User size={24} />} 
            label={t('contacts')} 
            badge={<Badge text={t('soon')} locked />}
          />
          <MenuItem 
            icon={<Phone size={24} />} 
            label={t('calls')} 
            badge={<Badge text={t('soon')} locked />}
          />
          <MenuItem 
            icon={<Bookmark size={24} className="fill-current text-tg-accent" />} 
            label={t('saved')} 
            onClick={onOpenSavedMessages}
            activeColor="text-tg-accent"
          />
          <MenuItem 
            icon={<Settings size={24} />} 
            label={t('settings')} 
            onClick={onOpenProfile} 
          />

          <div className="my-2 border-b border-black/5 dark:border-white/5 mx-4" />

          <MenuItem 
            icon={<UserPlus size={24} />} 
            label={t('invite')} 
            badge={<Badge text={t('soon')} />}
          />
          
          {isAdmin && onOpenAdmin && (
             <MenuItem 
                icon={<ShieldAlert size={24} className="text-red-500" />} 
                label="Admin Panel" 
                onClick={onOpenAdmin}
                badge={<Badge text="GOD MODE" color="text-red-500 border-red-500/30 bg-red-500/10" />}
             />
          )}
          
          <div className="mt-auto pt-4 pb-6 px-6">
             <div className="text-[11px] text-tg-secondary/40 font-medium">
                HouseGram Web v0.0.1.2
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  activeColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, badge, onClick, activeColor }) => (
  <div 
    onClick={onClick} 
    className="flex items-center px-6 py-3.5 space-x-6 hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent cursor-pointer transition-all group active:scale-[0.98]"
  >
    <div className={`${activeColor ? activeColor : 'text-tg-secondary group-hover:text-white'} transition-colors duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`}>
      {icon}
    </div>
    <div className="flex-1 flex justify-between items-center min-w-0">
      <span className="text-tg-text font-medium text-[15px] group-hover:translate-x-1 transition-transform duration-200">
        {label}
      </span>
      {badge}
    </div>
  </div>
);

const Badge: React.FC<{ text: string; locked?: boolean; color?: string }> = ({ text, locked, color }) => (
  <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-[4px] border transition-transform group-hover:scale-105 ${color || 'bg-tg-accent/10 border-tg-accent/20 text-tg-accent'}`}>
    {locked && <Lock size={9} className="opacity-70" />}
    <span className="text-[10px] font-bold uppercase tracking-wider">{text}</span>
  </div>
);

export default Sidebar;
