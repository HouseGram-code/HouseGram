
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Lock, Key, Mail, Check, AlertCircle, ChevronRight, Delete } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';

interface PrivacyScreenProps {
  onBack: () => void;
  passcode: string | null;
  setPasscode: (code: string | null) => void;
  recoveryEmail: string | null;
  setRecoveryEmail: (email: string | null) => void;
}

type Mode = 'menu' | 'passcode_create' | 'passcode_confirm' | 'email_input';

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ 
  onBack, passcode, setPasscode, recoveryEmail, setRecoveryEmail 
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('menu');
  const [inputCode, setInputCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [emailInput, setEmailInput] = useState(recoveryEmail || '');
  const [error, setError] = useState<string | null>(null);

  // Reset inputs when mode changes
  useEffect(() => {
    if (mode === 'menu') {
      setInputCode('');
      setConfirmCode('');
      setError(null);
    }
  }, [mode]);

  // Handle Passcode Input
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

  // Render Keypad
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

  // Render Passcode Dots
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

  // --- VIEWS ---

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
        <div className="bg-tg-sidebar px-4 py-3 flex items-center border-b border-tg-border">
          <button onClick={() => setMode('menu')} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <span className="text-white font-bold text-xl ml-4">{t('twoStepVerification')}</span>
        </div>
        
        <div className="flex-1 p-6 flex flex-col items-center">
             <div className="w-24 h-24 bg-tg-teal/10 rounded-full flex items-center justify-center mb-6 mt-10">
                 <Mail size={48} className="text-tg-teal" />
             </div>
             <h2 className="text-white font-bold text-xl mb-3 text-center">{t('setRecoveryEmail')}</h2>
             <p className="text-tg-secondary text-center text-sm mb-8 max-w-xs">{t('emailDesc')}</p>
             
             <div className="w-full max-w-sm space-y-4">
                 <div className="relative group">
                     <input 
                       type="email"
                       value={emailInput}
                       onChange={(e) => setEmailInput(e.target.value)}
                       placeholder={t('emailPlaceholder')}
                       className="w-full bg-tg-sidebar border border-tg-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tg-accent transition-colors"
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

  // MAIN MENU
  return (
    <div className="flex flex-col h-full bg-tg-bg animate-fadeIn">
      <div className="bg-tg-sidebar px-4 py-3 flex items-center border-b border-tg-border shadow-sm z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-colors active:scale-90">
          <ArrowLeft size={24} />
        </button>
        <span className="text-white font-bold text-xl ml-4">{t('privacy')}</span>
      </div>

      <div className="flex-1 overflow-y-auto pt-2">
        {/* Header Section */}
        <div className="px-5 py-2 text-xs font-bold text-tg-accent uppercase tracking-widest">{t('security')}</div>
        
        {/* Passcode Item */}
        <div className="bg-tg-sidebar border-y border-tg-border">
            <div 
              onClick={() => {
                  if (!passcode) setMode('passcode_create');
              }}
              className="px-5 py-3.5 flex items-center space-x-5 hover:bg-white/5 cursor-pointer transition-colors group"
            >
                <div className="text-tg-secondary group-hover:text-tg-accent transition-colors">
                    <Lock size={22} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                    <span className="text-white text-[16px]">{t('passcodeLock')}</span>
                    <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${passcode ? 'text-tg-online' : 'text-tg-secondary'}`}>
                            {passcode ? t('enabled') : t('disabled')}
                        </span>
                        {!passcode && <ChevronRight size={16} className="text-tg-secondary/50" />}
                    </div>
                </div>
            </div>

            {passcode && (
                <div className="border-t border-tg-border/50 animate-form-entrance">
                    <button 
                        onClick={() => setPasscode(null)}
                        className="w-full px-5 py-3 text-left text-red-500 font-medium hover:bg-red-500/10 transition-colors pl-16 text-[15px]"
                    >
                        {t('turnOffPasscode')}
                    </button>
                     <div className="border-t border-tg-border/50" />
                     <button 
                        onClick={() => { setInputCode(''); setConfirmCode(''); setMode('passcode_create'); }}
                        className="w-full px-5 py-3 text-left text-tg-accent font-medium hover:bg-white/5 transition-colors pl-16 text-[15px]"
                    >
                        {t('changePasscode')}
                    </button>
                </div>
            )}
        </div>

        {/* 2FA Item */}
        <div className="mt-4 bg-tg-sidebar border-y border-tg-border">
             <div 
               onClick={() => setMode('email_input')}
               className="px-5 py-3.5 flex items-center space-x-5 hover:bg-white/5 cursor-pointer transition-colors group"
             >
                <div className="text-tg-secondary group-hover:text-tg-accent transition-colors">
                    <Key size={22} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                    <span className="text-white text-[16px]">{t('twoStepVerification')}</span>
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
