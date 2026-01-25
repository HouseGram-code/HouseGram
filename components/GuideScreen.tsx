
import React, { useState } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, Camera, Mic, Bell, Paperclip, User } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';

interface GuideScreenProps {
  onBack: () => void;
}

const GuideScreen: React.FC<GuideScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const GUIDES = [
    { icon: <Camera size={20} />, q: t('guide_1_q'), a: t('guide_1_a'), color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: <User size={20} />, q: t('guide_2_q'), a: t('guide_2_a'), color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { icon: <Mic size={20} />, q: t('guide_3_q'), a: t('guide_3_a'), color: 'text-red-400', bg: 'bg-red-400/10' },
    { icon: <Bell size={20} />, q: t('guide_4_q'), a: t('guide_4_a'), color: 'text-green-400', bg: 'bg-green-400/10' },
    { icon: <Paperclip size={20} />, q: t('guide_5_q'), a: t('guide_5_a'), color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-tg-bg overflow-hidden animate-fadeIn relative">
      <div className="z-20 bg-tg-sidebar px-4 py-3 flex items-center shadow-md border-b border-tg-border">
        <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-colors active:scale-90">
          <ArrowLeft size={24} />
        </button>
        <span className="text-white font-bold text-xl ml-4">{t('howToUse')}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-tr from-tg-accent to-blue-600 rounded-[28px] flex items-center justify-center shadow-lg shadow-tg-accent/20 mb-2">
                 <BookOpen size={40} className="text-white" />
            </div>
            <p className="text-tg-secondary text-center text-sm max-w-[280px]">
               {t('featFastDesc')}
            </p>
        </div>

        <div className="bg-tg-sidebar border-y border-tg-border">
           {GUIDES.map((item, index) => (
             <div key={index} className="border-b border-tg-border/50 last:border-none">
                <button 
                  onClick={() => toggleItem(index)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left group"
                >
                   <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.bg} ${item.color}`}>
                         {item.icon}
                      </div>
                      <span className="text-white font-medium text-[16px] group-hover:text-tg-accent transition-colors">{item.q}</span>
                   </div>
                   <div className={`text-tg-secondary transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-tg-accent' : ''}`}>
                      <ChevronDown size={20} />
                   </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                   <div className="px-5 pl-[70px] pb-5 text-tg-secondary text-[15px] leading-relaxed pr-8">
                      {item.a}
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default GuideScreen;
