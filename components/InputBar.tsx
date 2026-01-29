
import React, { useState, useRef } from 'react';
import { Smile, Paperclip, Camera, Mic, Send, Zap } from 'lucide-react';
import { Message, User } from '../types.ts';

interface InputBarProps {
  onSend: (text: string) => void;
  currentUser: User;
}

const InputBar: React.FC<InputBarProps> = ({ onSend, currentUser }) => {
  const [text, setText] = useState('');
  
  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="p-2 bg-transparent flex items-end space-x-2 pb-safe z-20">
      <div className="flex-1 bg-white dark:bg-wa-darkSidebar rounded-[25px] flex items-end px-3 py-1 shadow-sm border border-black/5 dark:border-white/5">
         <button className="p-2 text-tg-secondary"><Smile size={24} /></button>
         <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Message" 
            className="flex-1 bg-transparent py-3 px-2 text-tg-text outline-none text-[16px]"
         />
         <button className="p-2 text-tg-secondary rotate-45"><Paperclip size={24} /></button>
         {!text.trim() && <button className="p-2 text-tg-secondary"><Camera size={24} /></button>}
      </div>
      
      <button 
        onClick={handleSend}
        className="w-12 h-12 rounded-full bg-wa-green text-white flex items-center justify-center shadow-md active:scale-90 transition-transform flex-shrink-0"
      >
        {text.trim() ? <Send size={22} className="ml-1" /> : <Mic size={24} />}
      </button>
    </div>
  );
};

export default InputBar;
