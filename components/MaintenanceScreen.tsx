
import React from 'react';
import { Info, MessageCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';

const MaintenanceScreen: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-[#ECE5DD] dark:bg-[#111b21] relative z-[100] p-8">
      <div className="w-24 h-24 bg-wa-green rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-bounce">
          <MessageCircle size={56} className="text-white" />
      </div>
      
      <h1 className="text-3xl font-bold text-[#075E54] dark:text-wa-green text-center mb-4">
         We've moved!
      </h1>
      
      <div className="bg-white dark:bg-wa-darkSidebar p-6 rounded-2xl shadow-xl max-w-sm text-center border border-black/5">
          <p className="text-tg-text mb-6 leading-relaxed">
             HouseGram has evolved into a new beautiful experience inspired by WhatsApp. 
             We've upgraded our systems for better speed and security.
          </p>
          
          <button 
             onClick={() => window.location.reload()}
             className="w-full bg-wa-green text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 active:scale-95 transition-transform"
          >
             <span>Open New WhatsAppGram</span>
             <ArrowRight size={20} />
          </button>
      </div>
      
      <p className="mt-10 text-[10px] text-tg-secondary uppercase tracking-[0.3em]">
          Transition Mode Active
      </p>
    </div>
  );
};

export default MaintenanceScreen;
