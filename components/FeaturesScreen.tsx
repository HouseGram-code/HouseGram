import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCheck, Edit2, Shield, Zap, Info, 
  Mic, Image, ShieldCheck, User as UserIcon, Lock, Send, Play
} from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';

interface FeaturesScreenProps {
  onBack: () => void;
}

const FeaturesScreen: React.FC<FeaturesScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 20);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#000000] overflow-hidden relative">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_50%,rgba(42,171,238,0.08),transparent_60%)] pointer-events-none" />

      {/* Glass Header */}
      <div className={`absolute top-0 left-0 right-0 z-50 px-4 py-4 flex items-center transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
        <button onClick={onBack} className="p-2 -ml-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90 z-50">
          <ArrowLeft size={24} />
        </button>
        <span className={`text-white font-black text-xl ml-4 tracking-tight transition-all duration-500 ${scrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
          {t('features')}
        </span>
      </div>

      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar relative z-10"
      >
        <div className="flex flex-col items-center pb-24 pt-20 px-4">
          
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12 relative animate-fadeIn">
            <div className="w-20 h-20 bg-gradient-to-tr from-tg-accent to-blue-600 rounded-[28px] mx-auto flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(42,171,238,0.5)] mb-6">
                 <Zap size={40} className="text-white fill-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              HouseGram
            </h1>
            <p className="text-tg-secondary font-medium text-lg max-w-xs mx-auto leading-relaxed">
              Fast. Secure. Powerful.
            </p>
          </div>

          <div className="w-full max-w-[400px] space-y-6">
            <FeatureCard 
              icon={<Zap size={16} className="text-white" />}
              title={t('featFastTitle')}
              desc={t('featFastDesc')}
              color="bg-amber-500"
            >
              <FastMessagingDemo />
            </FeatureCard>

            <FeatureCard 
              icon={<ShieldCheck size={16} className="text-white" />}
              title={t('featSecureTitle')}
              desc={t('featSecureDesc')}
              color="bg-emerald-500"
            >
              <SecurityScanningDemo />
            </FeatureCard>

            <FeatureCard 
              icon={<Image size={16} className="text-white" />}
              title={t('featMediaTitle')}
              desc={t('featMediaDesc')}
              color="bg-blue-500"
            >
               <ParallaxMediaDemo />
            </FeatureCard>

            <FeatureCard 
              icon={<Mic size={16} className="text-white" />}
              title={t('featVoiceTitle')}
              desc={t('featVoiceDesc')}
              color="bg-rose-500"
            >
               <SonicVoiceDemo />
            </FeatureCard>

            <FeatureCard 
              icon={<Edit2 size={16} className="text-white" />}
              title={t('featProfileTitle')}
              desc={t('featProfileDesc')}
              color="bg-purple-500"
            >
               <ProfileMorphDemo />
            </FeatureCard>

            <FeatureCard 
              icon={<Lock size={16} className="text-white" />}
              title={t('featPrivacyTitle')}
              desc={t('featPrivacyDesc')}
              color="bg-gray-500"
            >
               <PrivacySecurityDemo />
            </FeatureCard>

          </div>
          
          <div className="mt-16 text-white/20 text-xs font-mono uppercase tracking-[0.2em]">
            HouseGram for Web
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Container Component ---

const FeatureCard: React.FC<{ 
  children: React.ReactNode; 
  icon: React.ReactNode; 
  title: string; 
  desc: string;
  color: string;
}> = ({ children, icon, title, desc, color }) => (
  <div className="bg-[#1c1c1d] rounded-[20px] overflow-hidden shadow-xl border border-white/5 transform transition-transform duration-500 hover:scale-[1.02]">
    {/* Visual Area */}
    <div className="h-[240px] bg-[#0f0f10] relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]" />
        {children}
    </div>
    
    {/* Text Area */}
    <div className="p-6 relative bg-[#1c1c1d]">
        <div className="flex items-center space-x-4 mb-2">
           <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shadow-lg`}>
              {icon}
           </div>
           <h3 className="text-[19px] font-bold text-white tracking-tight">{title}</h3>
        </div>
        <p className="text-[#8e8e93] leading-relaxed text-[15px] pl-12">{desc}</p>
    </div>
  </div>
);

// --- 1. Fast Messaging Demo ---

const FastMessagingDemo: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = [
      () => setStep(1), // Typing
      () => setStep(2), // Sent 1
      () => setStep(3), // Typing reply
      () => setStep(4), // Received 1
      () => setStep(0), // Reset
    ];

    let timeouts: ReturnType<typeof setTimeout>[] = [];
    
    const delays = [0, 800, 1600, 2600, 3600];

    delays.forEach((delay, index) => {
        const id = setTimeout(sequence[index], delay);
        timeouts.push(id);
    });

    // Reset loop
    const resetId = setTimeout(() => {
       setStep(0); 
    }, 6000);
    timeouts.push(resetId);

    return () => timeouts.forEach(clearTimeout);
  }, [step === 0]); // Re-run when step resets to 0

  return (
    <div className="w-full max-w-[280px] flex flex-col space-y-3 px-4">
       {/* Outgoing */}
       <div className={`self-end transform transition-all duration-500 origin-bottom-right ${step >= 2 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-4'}`}>
          <div className="bg-tg-accent px-4 py-2 rounded-[18px] rounded-tr-sm text-white text-sm shadow-sm">
             Hey, is HouseGram fast?
          </div>
       </div>

       {/* Incoming Typing / Message */}
       <div className={`self-start transform transition-all duration-500 origin-bottom-left ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {step === 1 || step === 3 ? (
              <div className="bg-[#2c2c2e] px-4 py-3 rounded-[18px] rounded-tl-sm w-16 flex items-center justify-center space-x-1">
                 <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                 <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                 <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
          ) : step >= 4 ? (
              <div className="bg-[#2c2c2e] px-4 py-2 rounded-[18px] rounded-tl-sm text-white text-sm shadow-sm">
                 It's faster than light! ⚡️
              </div>
          ) : null}
       </div>
    </div>
  );
};

// --- 2. Security Demo ---

const SecurityScanningDemo: React.FC = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
       <div className="relative z-10 w-20 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-2xl overflow-hidden">
          <Shield size={40} className="text-white fill-white/20 z-10" />
          <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-transparent to-white/60 opacity-50 animate-scan-y" />
       </div>
       
       {/* Floating Particles */}
       <div className="absolute inset-0 pointer-events-none">
          <Shield size={12} className="absolute text-emerald-500/30 animate-float top-[20%] left-[20%]" />
          <Lock size={14} className="absolute text-emerald-500/30 animate-float top-[60%] right-[20%]" style={{ animationDelay: '1s' }} />
          <ShieldCheck size={10} className="absolute text-emerald-500/30 animate-float bottom-[20%] left-[40%]" style={{ animationDelay: '2s' }} />
       </div>
    </div>
  );
};

// --- 3. Media Demo ---

const ParallaxMediaDemo: React.FC = () => {
  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
       <div className="grid grid-cols-3 gap-2 w-[120%] h-[120%] transform -rotate-12 opacity-80 animate-slow-pan">
          {[...Array(12)].map((_, i) => (
             <div 
               key={i} 
               className={`rounded-lg shadow-lg bg-cover bg-center ${
                 i % 3 === 0 ? 'bg-blue-500' : i % 3 === 1 ? 'bg-purple-500' : 'bg-pink-500'
               }`}
               style={{ 
                  height: i % 2 === 0 ? '80px' : '120px',
                  opacity: 0.6 + (Math.random() * 0.4)
               }} 
             />
          ))}
       </div>
    </div>
  );
};

// --- 4. Voice Demo ---

const SonicVoiceDemo: React.FC = () => {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
       setPlaying(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center space-x-3">
       <div className={`w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg transition-transform duration-300 ${playing ? 'scale-90' : 'scale-100'}`}>
          {playing ? <div className="w-3 h-3 bg-white rounded-[2px]" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
       </div>
       
       <div className="bg-[#2c2c2e] p-3 rounded-2xl rounded-tl-sm flex items-center space-x-1 h-12 w-40 overflow-hidden">
          {[...Array(15)].map((_, i) => (
             <div 
               key={i} 
               className="w-1 bg-rose-500 rounded-full transition-all duration-300 ease-in-out"
               style={{ 
                 height: playing ? `${20 + Math.random() * 80}%` : '20%',
                 opacity: playing ? 1 : 0.5
               }} 
             />
          ))}
       </div>
    </div>
  );
};

// --- 5. Profile Demo ---

const ProfileMorphDemo: React.FC = () => {
   const [active, setActive] = useState(0);
   const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
   const names = ['Alex', 'Max', 'Sam'];

   useEffect(() => {
      const interval = setInterval(() => {
         setActive(prev => (prev + 1) % colors.length);
      }, 2500);
      return () => clearInterval(interval);
   }, []);

   return (
     <div className="w-56 bg-[#1c1c1d] rounded-2xl p-4 flex flex-col items-center shadow-2xl border border-white/5 relative overflow-hidden transition-all duration-500">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3 transition-colors duration-500 ${colors[active]}`}>
           {names[active].charAt(0)}
        </div>
        <div className="w-full flex flex-col items-center space-y-2">
           <div className="h-4 w-24 bg-white/20 rounded-full overflow-hidden relative">
              <span key={active} className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold animate-fadeIn">
                  {names[active]}
              </span>
           </div>
           <div className="h-3 w-32 bg-white/10 rounded-full" />
        </div>
        
        {/* Floating Edit Icon */}
        <div className="absolute top-3 right-3 p-1.5 bg-blue-500 rounded-full animate-pulse">
           <Edit2 size={12} className="text-white" />
        </div>
     </div>
   );
};

// --- 6. Privacy Demo ---

const PrivacySecurityDemo: React.FC = () => {
    const [dots, setDots] = useState(0);
    const [unlocked, setUnlocked] = useState(false);

    useEffect(() => {
       let isMounted = true;
       const sequence = async () => {
          if (!isMounted) return;
          setDots(0); setUnlocked(false);
          await new Promise(r => setTimeout(r, 1000));
          if (!isMounted) return;
          setDots(1);
          await new Promise(r => setTimeout(r, 300));
          if (!isMounted) return;
          setDots(2);
          await new Promise(r => setTimeout(r, 300));
          if (!isMounted) return;
          setDots(3);
          await new Promise(r => setTimeout(r, 300));
          if (!isMounted) return;
          setDots(4);
          await new Promise(r => setTimeout(r, 400));
          if (!isMounted) return;
          setUnlocked(true);
          await new Promise(r => setTimeout(r, 2000));
          if (!isMounted) return;
          sequence();
       };
       sequence();
       return () => { isMounted = false; };
    }, []);

    return (
      <div className="flex flex-col items-center space-y-6">
         <div className={`transition-all duration-500 transform ${unlocked ? 'scale-110 text-green-500' : 'scale-100 text-white'}`}>
            {unlocked ? <CheckCheck size={48} /> : <Lock size={48} />}
         </div>
         
         <div className="flex space-x-4">
            {[1, 2, 3, 4].map(i => (
               <div 
                 key={i} 
                 className={`w-3 h-3 rounded-full border border-white/30 transition-all duration-200 ${
                    i <= dots ? 'bg-white scale-110' : 'bg-transparent scale-100'
                 } ${unlocked ? 'bg-green-500 border-green-500' : ''}`}
               />
            ))}
         </div>
      </div>
    );
};

export default FeaturesScreen;