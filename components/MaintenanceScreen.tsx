
import React from 'react';
import { MessageCircle, Hammer, Construction, Zap, Settings, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';

const MaintenanceScreen: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-[#111b21] relative z-[100] p-8 overflow-hidden font-sans">
      {/* Animated Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(37,211,102,0.1)_0%,transparent_60%)] pointer-events-none" />
      
      {/* Decorative Circles */}
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-wa-green/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 bg-wa-teal/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
        {/* Main Icon Container */}
        <div className="relative mb-12">
            <div className="w-32 h-32 bg-wa-green rounded-[40px] flex items-center justify-center shadow-[0_20px_50px_rgba(37,211,102,0.3)] animate-form-entrance">
                <MessageCircle size={70} className="text-white fill-white/10" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center border-4 border-[#111b21] shadow-xl animate-bounce">
                <Hammer size={24} className="text-white" />
            </div>
        </div>
        
        <h1 className="text-4xl font-black text-white text-center mb-6 tracking-tight">
           Сайт временно закрыт
        </h1>
        
        <div className="bg-[#202c33]/80 backdrop-blur-xl p-8 rounded-[32px] shadow-2xl border border-white/5 text-center animate-fadeIn">
            <p className="text-[#aebac1] text-lg leading-relaxed mb-8">
               Мы работаем над глобальным обновлением — <span className="text-wa-green font-bold">новым аналогом WhatsApp</span>. 
               Платформа станет еще быстрее, красивее и безопаснее. 
            </p>
            
            {/* Status indicators */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                    <Zap size={20} className="text-wa-green mb-2" />
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Performance</span>
                    <span className="text-white font-bold">100% Native</span>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                    <ShieldCheck size={20} className="text-wa-blue mb-2" />
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Security</span>
                    <span className="text-white font-bold">End-to-End</span>
                </div>
            </div>

            {/* Simulated Progress Bar */}
            <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden mb-2">
                <div className="bg-gradient-to-r from-wa-teal to-wa-green h-full w-[75%] animate-pulse rounded-full shadow-[0_0_15px_rgba(37,211,102,0.5)]" />
            </div>
            <div className="flex justify-between text-[11px] text-[#8696a0] font-bold uppercase tracking-wider">
                <span>Building Experience</span>
                <span className="animate-pulse">75% Complete</span>
            </div>
        </div>

        <div className="mt-12 flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 text-[#8696a0] bg-black/20 px-4 py-2 rounded-full border border-white/5">
                <Construction size={16} />
                <span className="text-sm font-medium">Технические работы в процессе</span>
            </div>
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-black">
                HouseGram Next Gen
            </p>
        </div>
      </div>
      
      {/* Bottom Floating Elements */}
      <div className="absolute bottom-10 left-10 opacity-20 hidden md:block">
          <Settings size={100} className="text-wa-green animate-spin-slow" />
      </div>
    </div>
  );
};

export default MaintenanceScreen;
