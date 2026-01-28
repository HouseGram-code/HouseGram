
import React, { useState, useEffect } from 'react';
import { Check, CheckCheck, FileText, Gift as GiftIcon, Zap, User as UserIcon, Languages } from 'lucide-react';
import { Message } from '../types.ts';
import { useLanguage } from '../LanguageContext.tsx';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  onViewGift?: (msg: Message) => void;
}

// Helper to determine if text contains only emojis and how many
const getEmojiCount = (text: string): number => {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
  const cleanText = text.trim();
  if (!cleanText) return 0;
  const textWithoutEmojis = cleanText.replace(emojiRegex, '').trim();
  if (textWithoutEmojis.length > 0) return 0;
  const matches = cleanText.match(emojiRegex);
  return matches ? matches.length : 0;
};

// Helper for formatting bold text
const formatText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const NEWS_UPDATE_EN_SUBSTRING = "Update v0.0.1.2: Fixed Upload Skidding";
const NEWS_UPDATE_RU = `🚀 **Обновление v0.0.1.2 уже здесь!**\n\nМы услышали ваши отзывы! Это обновление обеспечивает более плавную работу и новые мощные инструменты.\n\n📸 **Мгновенная загрузка**: Мы исправили проблему «проскальзывания». Внедрен новый движок сжатия на клиенте — фото загружаются мгновенно.\n\n💎 **Баланс Zippers**: Теперь точный баланс виден в Настройках.\n\n⚡ **Стабильность**: Улучшена производительность и исправлены ошибки.\n\nОбновление установлено автоматически. Наслаждайтесь!`;

// 3D Dice Component
const Dice: React.FC<{ value: number }> = ({ value }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isRolling, setIsRolling] = useState(true);

  useEffect(() => {
    setIsRolling(true);
    const rollDuration = 600;

    let finalX = 0;
    let finalY = 0;
    
    switch (value) {
        case 1: finalX = 0; finalY = 0; break;
        case 6: finalX = 0; finalY = 180; break;
        case 2: finalX = 90; finalY = 0; break;
        case 5: finalX = -90; finalY = 0; break;
        case 3: finalX = 0; finalY = -90; break;
        case 4: finalX = 0; finalY = 90; break;
    }
    
    finalX += (Math.random() - 0.5) * 5;
    finalY += (Math.random() - 0.5) * 5;

    setRotation({ x: finalX, y: finalY });

    const timer = setTimeout(() => setIsRolling(false), rollDuration);
    return () => clearTimeout(timer);
  }, [value]);

  const Dot = () => <div className="w-2.5 h-2.5 dice-dot mx-auto" />;
  const AccentDot = () => <div className="w-3 h-3 dice-dot accent mx-auto shadow-md" />;

  const Face1 = () => <div className="dots-container"><div className="dot-center"><AccentDot /></div></div>;
  const Face2 = () => <div className="dots-container"><div className="dot-tl"><Dot /></div><div className="dot-br"><Dot /></div></div>;
  const Face3 = () => <div className="dots-container"><div className="dot-tl"><Dot /></div><div className="dot-center"><Dot /></div><div className="dot-br"><Dot /></div></div>;
  const Face4 = () => <div className="dots-container"><div className="dot-tl"><Dot /></div><div className="dot-tr"><Dot /></div><div className="dot-bl"><Dot /></div><div className="dot-br"><Dot /></div></div>;
  const Face5 = () => <div className="dots-container"><div className="dot-tl"><Dot /></div><div className="dot-tr"><Dot /></div><div className="dot-center"><Dot /></div><div className="dot-bl"><Dot /></div><div className="dot-br"><Dot /></div></div>;
  const Face6 = () => <div className="dots-container"><div className="dot-tl"><Dot /></div><div className="dot-mr"><Dot /></div><div className="dot-bl"><Dot /></div><div className="dot-tr"><Dot /></div><div className="dot-ml"><Dot /></div><div className="dot-br"><Dot /></div></div>;

  return (
    <div className="dice-scene select-none">
        <div 
            className="dice" 
            style={{ 
                transform: isRolling 
                  ? `rotateX(${720 + rotation.x}deg) rotateY(${720 + rotation.y}deg)` 
                  : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` 
            }}
        >
            <div className="dice-face face-1"><Face1 /></div>
            <div className="dice-face face-2"><Face2 /></div>
            <div className="dice-face face-3"><Face3 /></div>
            <div className="dice-face face-4"><Face4 /></div>
            <div className="dice-face face-5"><Face5 /></div>
            <div className="dice-face face-6"><Face6 /></div>
        </div>
    </div>
  );
};

// Basketball Component
const Basketball: React.FC<{ value: number }> = ({ value }) => {
  const [animate, setAnimate] = useState(false);
  const isSwish = value >= 4;

  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 2000);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="relative w-[140px] h-[140px] flex items-end justify-center bg-[#2b2b2b]/10 rounded-xl overflow-hidden shadow-inner border border-white/5">
       <div className="absolute inset-0 bg-tg-pattern opacity-10" />
       
       {/* Hoop */}
       <div className="absolute top-[30px] right-[20px] w-12 h-1 border-4 border-orange-500 rounded z-10" />
       <div className="absolute top-[34px] right-[24px] w-10 h-10 border-2 border-dashed border-white/50 rounded-b-lg opacity-60 z-0" />
       
       {/* Backboard */}
       <div className="absolute top-[5px] right-[10px] w-[54px] h-[40px] bg-white border-2 border-gray-400 rounded-sm z-0">
          <div className="absolute top-[20px] left-[15px] w-[24px] h-[18px] border-2 border-orange-500" />
       </div>

       {/* Ball */}
       <div 
          key={animate ? 'anim' : 'idle'}
          className={`text-[28px] absolute left-2 bottom-2 ${animate ? (isSwish ? 'anim-swish' : 'anim-miss') : 'opacity-0'}`}
       >
          🏀
       </div>
    </div>
  );
};

// Dart Component
const Dart: React.FC<{ value: number }> = ({ value }) => {
    const [animate, setAnimate] = useState(false);
    
    useEffect(() => {
        setAnimate(true);
        const t = setTimeout(() => setAnimate(false), 1000);
        return () => clearTimeout(t);
    }, [value]);

    // Map 1-6 to coords
    const getCoords = (val: number) => {
        switch(val) {
            case 6: return 'translate(0px, 0px)'; // Bullseye
            case 5: return 'translate(10px, -10px)'; // Inner ring
            case 4: return 'translate(-10px, 15px)'; // Middle
            case 3: return 'translate(20px, 10px)';
            case 2: return 'translate(-25px, -5px)';
            default: return 'translate(35px, 35px)'; // Miss/Outer
        }
    };

    return (
        <div className="relative w-[120px] h-[120px] flex items-center justify-center">
            {/* Board Emoji as base */}
            <div className="text-[80px] leading-none">🎯</div>
            
            {/* Projectile */}
            <div 
              className={`absolute top-1/2 left-1/2 text-[24px] ${animate ? 'anim-dart' : ''}`}
              style={{ '--target-pos': getCoords(value) } as React.CSSProperties}
            >
                📌
            </div>
        </div>
    );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOutgoing, onViewGift }) => {
  const { t } = useLanguage();
  const [animKey, setAnimKey] = useState(0);
  const [isTranslated, setIsTranslated] = useState(false);
  
  const isMedia = message.type === 'image' || message.type === 'video';
  const isFile = message.type === 'file';
  const isGift = message.type === 'gift' && message.giftData;

  // Check for Big Emoji condition
  const emojiCount = (message.type === 'text' && message.text) ? getEmojiCount(message.text) : 0;
  const isBigEmoji = emojiCount > 0 && emojiCount <= 3;

  const triggerAnim = () => {
    setAnimKey(prev => prev + 1);
  };

  const getTranslatedText = (original: string) => {
      // Hardcoded translation for the specific news update demo
      if (original.includes(NEWS_UPDATE_EN_SUBSTRING)) {
          return NEWS_UPDATE_RU;
      }
      return original + "\n\n(Translation unavailable in demo)";
  };

  const currentText = isTranslated && message.text ? getTranslatedText(message.text) : message.text;
  
  // Interactive Emoji Logic
  if (message.interactiveEmoji) {
      const { type, value } = message.interactiveEmoji;
      return (
        <div className={`relative px-2 py-1 group ${isOutgoing ? 'ml-auto' : 'mr-auto'}`}>
            <div className="animate-emoji-pop origin-center cursor-pointer" onClick={triggerAnim} key={animKey}>
                {type === 'dice' && <Dice value={value} />}
                {type === 'basketball' && <Basketball value={value} />}
                {type === 'dart' && <Dart value={value} />}
            </div>
             <div className={`absolute bottom-0 ${isOutgoing ? '-right-6' : '-left-6'} flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full px-2 py-0.5 backdrop-blur-[4px] z-10`}>
                <span className="text-[10px] font-medium text-white">{message.timestamp}</span>
                 {isOutgoing && (
                  <div className="text-white">
                    {message.isRead ? <CheckCheck size={12} /> : <Check size={12} />}
                  </div>
                )}
             </div>
        </div>
      );
  }

  // --- GIFT MESSAGE BUBBLE ---
  if (isGift && message.giftData) {
      return (
        <div 
            onClick={() => onViewGift && onViewGift(message)}
            className={`cursor-pointer relative w-[180px] rounded-2xl shadow-xl animate-fadeIn overflow-hidden ${isOutgoing ? 'ml-auto' : 'mr-auto'} border border-white/10 bg-[#17212B] hover:scale-[1.02] transition-transform duration-200 active:scale-95`}
        >
            {/* Gift Background Glow */}
            <div className="absolute inset-0 opacity-40" style={{ backgroundColor: message.giftData.backgroundColor || '#2b2b2b' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-0" />
            
            <div className="relative z-10 flex flex-col items-center p-3 pt-6 pb-4">
                
                {/* Simplified Header - Just a tiny hint or remove completely. Keeping subtle text */}
                <div className="absolute top-2 left-0 right-0 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-tg-accent/80">
                        {message.giftData.isAnonymous ? 'Gift' : 'Gift'}
                    </span>
                </div>

                {/* Gift Image with Float Animation */}
                <div className="w-24 h-24 mb-2 filter drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] animate-plane-float">
                    <img src={message.giftData.imageUrl} alt={message.giftData.name} className="w-full h-full object-contain" />
                </div>
                
                {/* Gift Name & Price */}
                <div className="text-center">
                    <div className="inline-flex items-center space-x-1 bg-white/10 px-2 py-0.5 rounded-full">
                        <span className="text-amber-400 font-bold text-xs">{message.giftData.price}</span>
                        <Zap size={10} className="text-amber-400 fill-amber-400" />
                    </div>
                </div>
            </div>

            {/* Meta */}
            <div className="absolute bottom-2 right-2 flex items-center space-x-1 select-none pointer-events-none opacity-60 z-20">
                <span className="text-[9px] font-medium text-white/90 shadow-sm">{message.timestamp}</span>
                {isOutgoing && (
                    <div className="text-white/90 shadow-sm">
                    {message.isRead ? <CheckCheck size={10} /> : <Check size={10} />}
                    </div>
                )}
            </div>
        </div>
      );
  }

  if (isBigEmoji) {
     const fontSize = emojiCount === 1 ? 'text-[80px]' : emojiCount === 2 ? 'text-[60px]' : 'text-[45px]';
     const gap = emojiCount === 1 ? 'leading-tight' : 'leading-snug';
     
     let idleAnimation = '';
     if (emojiCount === 1 && message.text) {
        if (message.text.includes('❤️') || message.text.includes('🧡') || message.text.includes('💛') || message.text.includes('💚') || message.text.includes('💙') || message.text.includes('💜')) {
            idleAnimation = 'animate-heart-beat';
        } else {
            idleAnimation = 'animate-breathe';
        }
     }

     return (
        <div className={`relative px-2 py-1 group ${isOutgoing ? 'ml-auto' : 'mr-auto'}`}>
             <div 
               key={animKey}
               onClick={triggerAnim}
               className={`cursor-pointer drop-shadow-md animate-emoji-pop origin-center hover:scale-105 transition-transform duration-200`}
             >
                <div className={`${fontSize} ${gap} select-none ${idleAnimation}`}>
                   {message.text}
                </div>
             </div>
             <div className={`absolute bottom-1 ${isOutgoing ? 'right-0' : 'left-0'} flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full px-2 py-0.5 backdrop-blur-[4px]`}>
                <span className="text-[10px] font-medium text-white">{message.timestamp}</span>
                 {isOutgoing && (
                  <div className="text-white">
                    {message.isRead ? <CheckCheck size={12} /> : <Check size={12} />}
                  </div>
                )}
             </div>
        </div>
     );
  }

  if (isMedia) {
    return (
      <div 
        className={`relative max-w-[85%] p-1 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md animate-fadeIn ${
          isOutgoing 
            ? 'bg-tg-bubbleOut text-white rounded-tr-none' 
            : 'bg-tg-bubbleIn text-white rounded-tl-none'
        }`}
      >
        {message.type === 'image' && (
          <img src={message.mediaUrl} alt="Attachment" className="rounded-xl max-h-[300px] w-auto object-cover" />
        )}
        {message.type === 'video' && (
          <video src={message.mediaUrl} controls className="rounded-xl max-h-[300px] w-auto bg-black" />
        )}
        
        <div className="flex justify-between items-center mt-1 px-1">
          {message.text && <p className="text-[14px] px-1 pb-1">{formatText(message.text)}</p>}
          <div className="flex items-center space-x-1 ml-auto opacity-80 px-1 pb-1">
            <span className="text-[10px] font-medium text-white/90 drop-shadow-md">{message.timestamp}</span>
            {isOutgoing && (
              <div className="text-white/90 drop-shadow-md">
                {message.isRead ? <CheckCheck size={13} /> : <Check size={13} />}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isFile) {
    return (
      <div 
        className={`relative max-w-[85%] p-2 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md flex items-center space-x-3 animate-fadeIn ${
          isOutgoing 
            ? 'bg-tg-bubbleOut text-white rounded-tr-none' 
            : 'bg-tg-bubbleIn text-white rounded-tl-none'
        }`}
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <FileText size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-[120px] pr-2">
          <p className="text-[14px] font-medium truncate max-w-[200px]">{message.mediaName}</p>
          <p className="text-[12px] opacity-70">{message.mediaSize}</p>
        </div>
        
        <div className="absolute bottom-1 right-2 flex items-center space-x-1 select-none pointer-events-none opacity-80">
          <span className="text-[10px] font-medium text-white/70">{message.timestamp}</span>
          {isOutgoing && (
            <div className="text-white/70">
              {message.isRead ? <CheckCheck size={13} /> : <Check size={13} />}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative max-w-[85%] px-3 py-1.5 rounded-[18px] shadow-sm transition-all duration-300 hover:shadow-md animate-fadeIn group/bubble ${
        isOutgoing 
          ? 'bg-tg-bubbleOut text-white rounded-tr-[4px] ml-12' 
          : 'bg-tg-bubbleIn text-white rounded-tl-[4px] mr-12'
      }`}
    >
      <div className="pr-14 min-w-[60px]">
        <p className="text-[15px] whitespace-pre-wrap break-words leading-[1.4] selection:bg-white/20">
          {formatText(currentText || '')}
        </p>
      </div>

      {!isOutgoing && message.text && (
          <button 
              onClick={(e) => { e.stopPropagation(); setIsTranslated(!isTranslated); }}
              className="mt-1 flex items-center space-x-1 text-[10px] font-bold text-tg-accent hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded px-1.5 py-0.5 w-fit mb-0.5"
          >
              <Languages size={10} />
              <span>{isTranslated ? t('showOriginal') : t('translate')}</span>
          </button>
      )}
      
      <div className="absolute bottom-1 right-2 flex items-center space-x-1 select-none pointer-events-none opacity-80">
        <span className="text-[10px] font-medium text-white/70">{message.timestamp}</span>
        {isOutgoing && (
          <div className="text-white/70">
            {message.isRead ? <CheckCheck size={13} /> : <Check size={13} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
