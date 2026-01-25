
import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronRight, LifeBuoy, MessageCircle, ScrollText, FileText } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';

interface FAQScreenProps {
  onBack: () => void;
}

const FAQScreen: React.FC<FAQScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const [view, setView] = useState<'main' | 'policy'>('main');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const FAQS = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
  ];

  if (view === 'policy') {
    const rules = [
      { title: t('pp_1_title'), text: t('pp_1_text') },
      { title: t('pp_2_title'), text: t('pp_2_text') },
      { title: t('pp_3_title'), text: t('pp_3_text') },
      { title: t('pp_4_title'), text: t('pp_4_text') },
      { title: t('pp_5_title'), text: t('pp_5_text') },
    ];

    return (
      <div className="flex flex-col h-full w-full bg-tg-bg overflow-hidden animate-fadeIn relative">
        <div className="bg-tg-sidebar px-4 py-3 flex items-center border-b border-tg-border shadow-md z-10">
          <button onClick={() => setView('main')} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <span className="text-white font-bold text-xl ml-4">{t('privacyPolicy')}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-12">
           <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-tg-accent/10 rounded-2xl flex items-center justify-center text-tg-accent">
                 <ScrollText size={32} />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-white leading-tight">HouseGram</h2>
                 <p className="text-tg-secondary text-sm">{t('privacyPolicyDesc')}</p>
              </div>
           </div>

           <div className="space-y-8">
              {rules.map((rule, index) => (
                <div key={index} className="relative pl-6 border-l-2 border-tg-border/50 hover:border-tg-accent transition-colors duration-300">
                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-tg-bg border-2 border-tg-accent/50" />
                   <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                      <span className="text-tg-accent mr-2">{index + 1}.</span> {rule.title}
                   </h3>
                   <p className="text-tg-secondary text-[15px] leading-relaxed whitespace-pre-line">
                      {rule.text}
                   </p>
                </div>
              ))}
           </div>
           
           <div className="mt-12 pt-8 border-t border-tg-border/30 text-center">
              <p className="text-xs text-tg-secondary uppercase tracking-widest opacity-60">
                 Effective Date: January 2026
              </p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-tg-bg overflow-hidden animate-fadeIn relative">
      {/* Header */}
      <div className="z-20 bg-tg-sidebar px-4 py-3 flex items-center shadow-md border-b border-tg-border">
        <button onClick={onBack} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full transition-colors active:scale-90">
          <ArrowLeft size={24} />
        </button>
        <span className="text-white font-bold text-xl ml-4">{t('help')}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* Tech Support Banner */}
        <div className="p-6 m-4 bg-gradient-to-br from-tg-accent/20 to-blue-600/10 rounded-2xl border border-tg-accent/30 flex flex-col items-center text-center space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tg-accent/10 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <div className="w-16 h-16 bg-tg-accent rounded-full flex items-center justify-center shadow-lg shadow-tg-accent/30 animate-pulse-slow">
                <LifeBuoy size={32} className="text-white" />
            </div>
            
            <div>
                <h3 className="text-white font-bold text-lg">{t('supportTitle')}</h3>
                <p className="text-tg-secondary text-sm mt-1 max-w-xs mx-auto leading-relaxed">
                   {t('supportDesc')}
                </p>
            </div>

            <button disabled className="flex items-center space-x-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-white/50 cursor-not-allowed">
               <MessageCircle size={16} />
               <span className="text-sm font-medium">{t('soon')}</span>
            </button>
        </div>

        {/* FAQ List */}
        <div className="px-5 pb-2 text-xs font-bold text-tg-accent uppercase tracking-widest mt-2 ml-1">{t('faq')}</div>
        
        <div className="bg-tg-sidebar border-y border-tg-border">
           {FAQS.map((item, index) => (
             <div key={index} className="border-b border-tg-border/50 last:border-none">
                <button 
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                   <div className="flex items-start space-x-4">
                      <div className={`mt-0.5 p-1 rounded-full ${openIndex === index ? 'bg-tg-accent/20 text-tg-accent' : 'text-tg-secondary'}`}>
                         <HelpCircle size={18} />
                      </div>
                      <span className="text-white font-medium text-[15px] pr-4">{item.q}</span>
                   </div>
                   <div className={`text-tg-secondary transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                      <ChevronDown size={18} />
                   </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                   <div className="px-6 pb-5 pl-[52px] text-tg-secondary text-[14px] leading-relaxed">
                      {item.a}
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Privacy Policy Link */}
        <div className="mt-6 bg-tg-sidebar border-y border-tg-border">
            <div 
               onClick={() => setView('policy')}
               className="px-5 py-4 flex items-center space-x-5 hover:bg-white/5 cursor-pointer transition-colors group"
             >
                <div className="text-tg-secondary group-hover:text-tg-accent transition-colors">
                    <FileText size={22} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                    <span className="text-white text-[16px]">{t('privacyPolicy')}</span>
                    <ChevronRight size={16} className="text-tg-secondary/50" />
                </div>
            </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center text-center space-y-2 opacity-50">
           <p className="text-xs text-tg-secondary">HouseGram v1.2.0</p>
           <p className="text-[10px] text-tg-secondary">Pixel Perfect Build</p>
        </div>

      </div>
    </div>
  );
};

export default FAQScreen;
