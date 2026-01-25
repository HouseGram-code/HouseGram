
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, BellOff, Volume2, Vibrate, Check, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';

interface NotificationScreenProps {
  onBack: () => void;
}

const NotificationScreen: React.FC<NotificationScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    if ('Notification' in window) {
      const currentPerm = Notification.permission;
      setPermission(currentPerm);
      
      // Check local storage for user preference
      const storedPref = localStorage.getItem('hg_notifications_enabled');
      if (currentPerm === 'granted' && storedPref === 'true') {
        setIsPushEnabled(true);
      } else {
        setIsPushEnabled(false);
        // Ensure storage matches reality if permission was revoked externally
        if (currentPerm !== 'granted' && storedPref === 'true') {
            localStorage.setItem('hg_notifications_enabled', 'false');
        }
      }
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    if (isPushEnabled) {
      // User wants to disable
      setIsPushEnabled(false);
      localStorage.setItem('hg_notifications_enabled', 'false');
    } else {
      // User wants to enable
      if (permission === 'granted') {
         setIsPushEnabled(true);
         localStorage.setItem('hg_notifications_enabled', 'true');
         new Notification(t('testTitle'), {
            body: t('testBody'),
            icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png'
         });
      } else if (permission !== 'denied') {
         const result = await Notification.requestPermission();
         setPermission(result);
         if (result === 'granted') {
            setIsPushEnabled(true);
            localStorage.setItem('hg_notifications_enabled', 'true');
            new Notification(t('testTitle'), {
                body: t('testBody'),
                icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png'
            });
         }
      } else {
         // Permission denied
         // We can't programmatically request again, user must go to settings
         alert(t('permissionDenied'));
      }
    }
  };

  const sendTestNotification = () => {
    if (permission === 'granted') {
       new Notification(t('testTitle'), {
          body: t('testBody'),
          icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png'
       });
    } else {
       handleToggleNotifications();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-tg-bg overflow-hidden animate-fadeIn relative">
      <div className="z-20 bg-tg-sidebar px-4 py-3 flex items-center shadow-md border-b border-tg-border">
        <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-colors active:scale-90">
          <ArrowLeft size={24} />
        </button>
        <span className="text-white font-bold text-xl ml-4">{t('notifications')}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        
        {/* Enable Section */}
        <div className="bg-tg-sidebar border-b border-tg-border">
            <div 
              onClick={handleToggleNotifications}
              className="px-5 py-4 flex items-center space-x-5 hover:bg-white/5 cursor-pointer transition-colors group"
            >
                <div className={`transition-colors duration-300 ${isPushEnabled ? 'text-tg-online' : 'text-tg-secondary'}`}>
                    {isPushEnabled ? <Bell size={24} /> : <BellOff size={24} />}
                </div>
                <div className="flex-1 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-white text-[16px] font-medium">{t('enableNotifications')}</span>
                        <span className="text-tg-secondary text-[13px]">{isPushEnabled ? t('enabled') : t('disabled')}</span>
                    </div>
                    
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 relative ${isPushEnabled ? 'bg-tg-accent' : 'bg-[#3A3A3C]'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isPushEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
            </div>
            {permission === 'denied' && (
                <div className="px-5 py-3 bg-red-500/10 flex items-start space-x-3 border-t border-red-500/20">
                    <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{t('permissionDenied')}</p>
                </div>
            )}
            <p className="px-5 py-3 text-xs text-tg-secondary leading-relaxed border-t border-tg-border/30">
                {t('notificationsDesc')}
            </p>
        </div>

        {/* In-App Sounds */}
        <div className="mt-6 px-5 py-2 text-xs font-bold text-tg-accent uppercase tracking-widest">{t('inAppSounds')}</div>
        <div className="bg-tg-sidebar border-y border-tg-border">
             <div 
               onClick={() => setSoundEnabled(!soundEnabled)}
               className="px-5 py-3.5 flex items-center space-x-5 hover:bg-white/5 cursor-pointer transition-colors"
             >
                 <div className="text-tg-secondary"><Volume2 size={22} /></div>
                 <div className="flex-1 flex justify-between items-center">
                    <span className="text-white text-[16px]">{t('sound')}</span>
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 relative ${soundEnabled ? 'bg-tg-accent' : 'bg-[#3A3A3C]'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                 </div>
             </div>

             <div className="ml-[60px] border-b border-tg-border/30" />

             <div 
               onClick={() => setVibrationEnabled(!vibrationEnabled)}
               className="px-5 py-3.5 flex items-center space-x-5 hover:bg-white/5 cursor-pointer transition-colors"
             >
                 <div className="text-tg-secondary"><Vibrate size={22} /></div>
                 <div className="flex-1 flex justify-between items-center">
                    <span className="text-white text-[16px]">{t('vibrate')}</span>
                     <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 relative ${vibrationEnabled ? 'bg-tg-accent' : 'bg-[#3A3A3C]'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${vibrationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                 </div>
             </div>
        </div>

        {/* Test Notification */}
        <div className="mt-8 bg-tg-sidebar border-y border-tg-border">
             <div 
               onClick={sendTestNotification}
               className="px-5 py-4 flex items-center space-x-5 hover:bg-white/5 cursor-pointer transition-colors group"
             >
                 <div className="text-tg-accent group-hover:scale-110 transition-transform"><Check size={22} strokeWidth={3} /></div>
                 <div className="flex-1">
                    <p className="text-white text-[16px] font-medium">{t('testNotification')}</p>
                    <p className="text-tg-secondary text-[13px]">{t('testNotificationDesc')}</p>
                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default NotificationScreen;
