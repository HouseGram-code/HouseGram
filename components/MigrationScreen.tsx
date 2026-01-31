
import React from 'react';
import { Rocket, ExternalLink, X, Lock } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';
import { User } from '../types.ts';

interface MigrationScreenProps {
  currentUser: User | null;
  onClose: () => void;
  onLoginClick: () => void;
}

const MigrationScreen: React.FC<MigrationScreenProps> = ({ currentUser, onClose, onLoginClick }) => {
  const { t } = useLanguage();
  const NEW_SITE_URL = 'https://house-gram-web.vercel.app/';

  const canClose = currentUser && (currentUser.isAdmin || currentUser.isTester || currentUser.isOfficial);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0E1621] p-6 animate-fadeIn">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_50%,rgba(42,171,238,0.1),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-6">
        
        {/* Icon */}
        <div className="relative mb-4">
            <div className="absolute inset-0 bg-tg-accent/20 rounded-full blur-2xl animate-pulse" />
            <div className="w-24 h-24 bg-gradient-to-tr from-tg-accent to-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl relative z-10 transform hover:scale-105 transition-transform duration-500">
                <Rocket size={48} className="text-white" />
            </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">
                {t('migrationTitle')}
            </h1>
            <p className="text-tg-secondary text-lg leading-relaxed">
                {t('migrationDesc')}
            </p>
        </div>

        {/* Primary Action */}
        <a 
            href={NEW_SITE_URL}
            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
            <span>{t('goToNewVersion')}</span>
            <ExternalLink size={20} />
        </a>

        {/* Secondary Action (Admins Only) */}
        {canClose ? (
            <button 
                onClick={onClose}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
                <X size={18} />
                <span>{t('closeForTesters')}</span>
            </button>
        ) : (
            /* Login Link for Admins who are currently logged out */
            !currentUser && (
                <button 
                    onClick={onLoginClick}
                    className="mt-4 text-xs font-bold text-tg-secondary/50 hover:text-tg-accent uppercase tracking-widest flex items-center space-x-1 transition-colors"
                >
                    <Lock size={12} />
                    <span>{t('adminLogin')}</span>
                </button>
            )
        )}

      </div>
      
      {/* Footer Version */}
      <div className="absolute bottom-8 text-white/10 text-xs font-mono uppercase tracking-[0.2em]">
          LEGACY_VERSION_LOCKED
      </div>
    </div>
  );
};

export default MigrationScreen;
