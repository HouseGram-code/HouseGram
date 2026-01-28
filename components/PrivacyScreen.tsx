
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Lock, Key, Mail, Check, AlertCircle, ChevronRight, Delete, Eye, EyeOff, Clock, Star } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';
import { User } from '../types.ts';

interface PrivacyScreenProps {
  onBack: () => void;
  passcode: string | null;
  setPasscode: (code: string | null) => void;
  recoveryEmail: string | null;
  setRecoveryEmail: (email: string | null) => void;
  user: User;
  onUpdateUser: (u: User) => void;
}

type Mode = 'menu' | 'passcode_create' | 'passcode_confirm' | 'email_input' | 'last_seen_settings';

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ 
  onBack, passcode, setPasscode, recoveryEmail, setRecoveryEmail, user, onUpdateUser 
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('menu');
  const [inputCode, setInputCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [emailInput, setEmailInput] = useState(recoveryEmail || '');
  const [error, setError] = useState<string | null>(null);

  const [privacySetting, setPrivacySetting] = useState<'everybody' | 'nobody'>(user.lastSeenPrivacy || 'everybody');

  const handleUpdatePrivacy = (newSetting: 'everybody' | 'nobody') => {
      setPrivacySetting(newSetting);
      onUpdateUser({ ...user, lastSeenPrivacy: newSetting });
  };

  useEffect(() => {
    if (mode === 'menu') {
      setInputCode('');
      setConfirmCode('');
      setError(null);
    }
  }, [mode]);

  const handleDigitPress = (digit: string) => {
    setError(null);
    if (mode === 'passcode_create') {
      if (inputCode.length < 4) {
        const next = inputCode + digit;
        setInputCode(next);
        if (next.length === 4) {
          setTimeout(() => setMode('passcode_confirm'), 300);
        }
      }
    } else if (mode === 'passcode_confirm') {
      if (confirmCode.length < 4) {
        const next = confirmCode + digit;
        setConfirmCode(next);
        if (next.length === 4) {
          if (next === inputCode) {
            setPasscode(next);
            setTimeout(() => setMode('menu'), 300);
          } else {
            setError(t('passcodeMismatch'));
            setTimeout(() => {
              setConfirmCode('');
              setError(null);
            }, 1000);
          }
        }
      }
    }
  };

  const handleDeletePress = () => {
    if (mode === 'passcode_create') {
        setInputCode(prev => prev.slice(0, -1));
    } else {
        setConfirmCode(prev => prev.slice(0, -1));
    }
  };

  const handleSaveEmail = () => {
    if (emailInput.includes('@')) {
      setRecoveryEmail(emailInput);
      setMode('menu');
    } else {
      setError('Invalid email');
    }
  };

  const renderKeypad = () => (
    <div className="grid grid-cols-3 gap-x-8 gap-y-4 px-12 pb-12 mt-auto animate-form-entrance">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
        <button
          key={digit}
          onClick={() => handleDigitPress(digit.toString())}
          className="w-16 h-16 rounded-full bg-white/10 text-white text-2xl font-light hover:bg-white/20 active:bg-white/30 transition-colors flex items-center justify-center"
        >
          {digit}
        </button>
      ))}
      <div />
      <button
        onClick={() => handleDigitPress('0')}
        className="w-16 h-16 rounded-full bg-white/10 text-white text-2xl font-light hover:bg-white/20 active:bg-white/30 transition-colors flex items-center justify-center"
      >
        0
      </button>
      <button
        onClick={handleDeletePress}
        className="w-16 h-16 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
      >
        <Delete size={24} />
      </button>
    </div>
  );

  const renderDots = (code: string) => (
    <div className="flex space-x-4 justify-center my-8">
      {[0, 1, 2, 3].map(i => (
        <div 
          key={i} 
          className={`w-3.5 h-3.5 rounded-full border border-white transition-all duration-300 ${
            code.length > i ? 'bg-white scale-110' : 'bg-transparent scale-100'
          } ${error ? 'border-red-500 bg-red-500 animate-pulse' : ''}`}
        />
      ))}
    </div>
  );

  if (mode === 'passcode_create' || mode === 'passcode_confirm') {
    return (
      <div className="flex flex-col h-full bg-[#0E1621] relative animate-fadeIn">
        <div className="absolute top-4 left-4 z-20">
            <button onClick={() => setMode('menu')} className="text-white p-2">
                <ArrowLeft size={24} />
            </button>
        </div>
        <div className="flex-1 flex flex-col items-center pt-24">
            <div className="w-16 h-16 bg-tg-accent/10 rounded-full flex items-center justify-center mb-6 text-tg-accent">
                <Lock size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
                {mode === 'passcode_create' ? t('setPasscode') : t('reEnterPasscode')}
            </h2>
            <p className="text-tg-secondary text-sm mb-4">
                {mode === 'passcode_create' ? t('enterPasscode') : (error || t('reEnterPasscode'))}
            </p>
            {renderDots(mode === 'passcode_create' ? inputCode : confirmCode)}
            {renderKeypad()}
        </div>
      </div>
    );
  }

  if (mode === 'email_input') {
    return (
      <div className="flex flex-col h-full bg-tg-bg relative animate-fadeIn">
        <div className="bg-tg-sidebar px-4 py-3 flex items-center border-b border-black/5 dark:border-white/5">
          <button onClick={() => setMode('menu')} className="p-2 -ml-2 text-tg-text hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <span className="text-tg-text font-bold text-xl ml-4">{t('twoStepVerification')}</span>
        </div>
        
        <div className="flex-1 p-6 flex flex-col items-center">
             <div className="w-24 h-24 bg-tg-teal/10 rounded-full flex items-center justify-center mb-6 mt-10">
                 <Mail size={48} className="text-tg-teal" />
             </div>
             <h2 className="text-tg-text font-bold text-xl mb-3 text-center">{t('setRecoveryEmail')}</h2>
             <p className="text-tg-secondary text-center text-sm mb-8 max-w-xs">{t('emailDesc')}</p>
             
             <div className="w-full max-w-sm space-y-4">
                 <div className="relative group">
                     <input 
                       type="email"
                       value={emailInput}
                       onChange={(e) => setEmailInput(e.target.value)}
                       placeholder={t('emailPlaceholder')}
                       className="w-full bg-tg-sidebar border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-tg-text focus:outline-none focus:border-tg-accent transition-colors"
                       autoFocus
                     />
                 </div>
                 <button 
                   onClick={handleSaveEmail}
                   className="w-full bg-tg-accent text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform"
                 >
                   {t('save')}
                 </button>
             </div>
        </div>
      </div>
    );
  }

  if (mode === 'last_seen_settings') {
    return (
      <div className="flex flex-col h-full bg-tg-bg relative animate-fadeIn">
        <div className="bg-tg-sidebar px-4 py-3 flex items-center border-b border-black/5 dark:border-white/5">
          <button onClick={() => setMode('menu')} className="p-2 -ml-2 text-tg-text hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <span className="text-tg-text font-bold text-xl ml-4">{t('lastSeenTitle')}</span>
        </div>

        <div className="flex-1 p-0 overflow-y-auto">
             <div className="px-5 py-2 mt-4 text-xs font-bold text-tg-secondary uppercase tracking-widest">{t('whoCanSee')}</div>
             
             <div className="bg-tg-sidebar border-y border-black/5 dark:border-white/5">
                <div onClick={() => handleUpdatePrivacy('everybody')} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                   <span className="text-tg-text font-medium">{t('everybody')}</span>
                   {privacySetting === 'everybody' && <Check size={20} className="text-tg-accent" />}
                </div>
                <div className="border-b border-black/5 dark:border-white/5 ml-5" />
                <div onClick={() => handleUpdatePrivacy('nobody')} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                   <span className="text-tg-text font-medium">{t('nobody')}</span>
                   {privacySetting === 'nobody' && <Check size={20} className="text-tg-accent" />}
                </div>
             </div>

             <div className="px-5 py-3 text-sm text-tg-secondary leading-relaxed">
                {t('lastSeenDesc')}
             </div>

             {/* Premium Promo for Hidden Status */}
             {privacySetting === 'nobody' && (
                <div className="mx-4 mt-6 relative overflow-hidden rounded-2xl p-0.5 shadow-2xl animate-form-entrance">
                    {/* Animated Border Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 animate-spin-slow opacity-75" style={{ animationDuration: '3s' }} />
                    
                    <div className="relative bg-[#17212B] rounded-[14px] p-5 overflow-hidden">
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 blur-[40px] rounded-full pointer-events-none" />

                        <div className="flex items-start space-x-4 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shrink-0">
                                <Star size={20} className="text-white fill-white animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold text-lg leading-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                                    Premium Feature
                                </h3>
                                <p className="text-tg-secondary text-[13px] leading-relaxed mb-4">
                                    Users who hide their Last Seen time can still see the Last Seen time of others if they subscribe to <span className="text-pink-400 font-bold">Premium</span>.
                                </p>
                                
                                <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 group">
                                    <span>Unlock with Premium</span>
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             )}
        </div>
      </div>
    );
  }

  // MAIN MENU
  return (
    <div className="flex flex-col h-full bg-tg-bg animate-fadeIn">
      <div className="bg-tg-sidebar px-4 py-3 flex items-center border-b border-black/5 dark:border-white/5 shadow-sm z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-tg-text hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors active:scale-90">
          <ArrowLeft size={24} />
        </button>
        <span className="text-tg-text font-bold text-xl ml-4">{t('privacy')}</span>
      </div>

      <div className="flex-1 overflow-y-auto pt-2">
        <div className="px-5 py-2 text-xs font-bold text-tg-accent uppercase tracking-widest">{t('privacy')}</div>

        <div className="bg-tg-sidebar border-y border-black/5 dark:border-white/5">
           {/* Last Seen Menu */}
           <div 
             onClick={() => setMode('last_seen_settings')}
             className="px-5 py-3.5 flex items-center space-x-5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
           >
              <div className="text-tg-secondary group-hover:text-tg-accent transition-colors">
                  <Clock size={22} />
              </div>
              <div className="flex-1 flex justify-between items-center">
                  <span className="text-tg-text text-[16px]">{t('lastSeenTitle')}</span>
                  <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-tg-text/50">
                          {privacySetting === 'everybody' ? t('everybody') : t('nobody')}
                      </span>
                      <ChevronRight size={16} className="text-tg-secondary/50" />
                  </div>
              </div>
           </div>
        </div>


        {/* Security Section */}
        <div className="px-5 py-2 mt-4 text-xs font-bold text-tg-accent uppercase tracking-widest">{t('security')}</div>
        
        {/* Passcode Item */}
        <div className="bg-tg-sidebar border-y border-black/5 dark:border-white/5">
            <div 
              onClick={() => {
                  if (!passcode) setMode('passcode_create');
              }}
              className="px-5 py-3.5 flex items-center space-x-5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
            >
                <div className="text-tg-secondary group-hover:text-tg-accent transition-colors">
                    <Lock size={22} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                    <span className="text-tg-text text-[16px]">{t('passcodeLock')}</span>
                    <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${passcode ? 'text-tg-online' : 'text-tg-secondary'}`}>
                            {passcode ? t('enabled') : t('disabled')}
                        </span>
                        {!passcode && <ChevronRight size={16} className="text-tg-secondary/50" />}
                    </div>
                </div>
            </div>

            {passcode && (
                <div className="border-t border-black/5 dark:border-white/5 animate-form-entrance">
                    <button 
                        onClick={() => setPasscode(null)}
                        className="w-full px-5 py-3 text-left text-red-500 font-medium hover:bg-red-500/10 transition-colors pl-16 text-[15px]"
                    >
                        {t('turnOffPasscode')}
                    </button>
                     <div className="border-t border-black/5 dark:border-white/5" />
                     <button 
                        onClick={() => { setInputCode(''); setConfirmCode(''); setMode('passcode_create'); }}
                        className="w-full px-5 py-3 text-left text-tg-accent font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors pl-16 text-[15px]"
                    >
                        {t('changePasscode')}
                    </button>
                </div>
            )}
        </div>

        {/* 2FA Item */}
        <div className="mt-4 bg-tg-sidebar border-y border-black/5 dark:border-white/5">
             <div 
               onClick={() => setMode('email_input')}
               className="px-5 py-3.5 flex items-center space-x-5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group"
             >
                <div className="text-tg-secondary group-hover:text-tg-accent transition-colors">
                    <Key size={22} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                    <span className="text-tg-text text-[16px]">{t('twoStepVerification')}</span>
                    <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${recoveryEmail ? 'text-tg-online' : 'text-tg-secondary'}`}>
                            {recoveryEmail ? recoveryEmail : t('disabled')}
                        </span>
                        <ChevronRight size={16} className="text-tg-secondary/50" />
                    </div>
                </div>
            </div>
        </div>

        <div className="px-5 py-3 text-sm text-tg-secondary leading-relaxed">
            {t('featPrivacyDesc')}
        </div>
      </div>
    </div>
  );
};

export default PrivacyScreen;
