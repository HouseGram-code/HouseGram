
import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Message } from '../types.ts';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOutgoing }) => {
  return (
    <div className={`flex w-full ${isOutgoing ? 'justify-end' : 'justify-start'} mb-1 px-2`}>
        <div 
          className={`relative max-w-[85%] px-3 py-1.5 shadow-sm min-w-[80px] ${
            isOutgoing 
              ? 'bg-wa-light dark:bg-wa-darkBubbleOut text-black dark:text-white rounded-l-lg rounded-br-lg bubble-tail-out' 
              : 'bg-white dark:bg-wa-darkBubbleIn text-black dark:text-white rounded-r-lg rounded-bl-lg bubble-tail-in'
          }`}
        >
            <p className="text-[15px] leading-relaxed break-words pr-2">{message.text}</p>
            <div className="flex items-center justify-end space-x-1 mt-0.5 opacity-60">
                <span className="text-[10px] uppercase">{message.timestamp}</span>
                {isOutgoing && (
                    <div className={message.isRead ? 'text-wa-blue' : ''}>
                        {message.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default MessageBubble;
