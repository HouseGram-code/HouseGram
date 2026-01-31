
import React from 'react';
import { Settings, Construction, Clock, Shield } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';

const MaintenanceScreen: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-[#0E1621] relative overflow-hidden z-[100]">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_50%,rgba(42,171,238,0.05),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center animate-fadeIn">
        
        {/* Animated Icon Container */}
        <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 bg-tg-accent/10 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-full h-full flex items-center justify-center">
                <Settings size={80} className="text-tg-accent animate-[spin_8s_linear_infinite] opacity-80 absolute" />
                <Construction size={40} className="text-white relative z-10" />
            </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
          {t('maintenanceTitle')}
        </h1>
        
        <p className="text-lg text-tg-secondary max-w-md leading-relaxed mb-8">
          {t('maintenanceDesc')}
        </p>

        <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 shadow-sm">
            <Clock size={14} className="text-tg-accent" />
            <span className="text-sm font-medium text-white/70">{t('maintenanceSub')}</span>
        </div>

        {/* Footer */}
        <div className="absolute bottom-[-150px] opacity-30 text-xs tracking-[0.2em] font-mono text-tg-secondary">
            SYSTEM_LOCKED
        </div>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
