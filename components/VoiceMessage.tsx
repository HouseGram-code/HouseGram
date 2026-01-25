
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Check, CheckCheck } from 'lucide-react';
import { Message } from '../types.ts';

interface VoiceMessageProps {
  message: Message;
  isOutgoing: boolean;
}

const VoiceMessage: React.FC<VoiceMessageProps> = ({ message, isOutgoing }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getDurationSeconds = () => {
    if (!message.duration) return 0;
    const parts = message.duration.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    if (audioRef.current) {
        audioRef.current.load(); 
        audioRef.current.currentTime = 0;
    }
  }, [message.audioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      
      if (Number.isFinite(duration) && duration > 0) {
        setProgress((currentTime / duration) * 100);
      } else {
        const estimated = getDurationSeconds();
        if (estimated > 0) {
           setProgress(Math.min((currentTime / estimated) * 100, 100));
        }
      }
      
      if (audioRef.current.ended) {
        setIsPlaying(false);
        setProgress(0);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Fix for "plays only once": Reset to start if finished or near end
        if (audio.ended || (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 0.1)) {
             audio.currentTime = 0;
        }
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Playback error:", err);
      setIsPlaying(false);
    }
  };

  return (
    <div 
      className={`relative max-w-[85%] p-2 rounded-2xl flex items-center space-x-3 shadow-md ${
        isOutgoing 
          ? 'bg-tg-bubbleOut text-white rounded-tr-none' 
          : 'bg-tg-bubbleIn text-white rounded-tl-none'
      }`}
    >
      <audio 
        ref={audioRef} 
        src={message.audioUrl} 
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 text-tg-accent hover:brightness-95"
      >
        {isPlaying ? (
          <Pause size={20} fill="currentColor" className={isOutgoing ? 'text-tg-accent' : 'text-tg-bubbleIn'} />
        ) : (
          <Play size={20} fill="currentColor" className={`ml-0.5 ${isOutgoing ? 'text-tg-accent' : 'text-tg-bubbleIn'}`} />
        )}
      </button>

      <div className="flex flex-col flex-1 min-w-[120px]">
        {/* Visual Waveform / Progress Bar */}
        <div className="relative h-6 mb-1 flex items-center cursor-pointer" onClick={(e) => {
             if (audioRef.current) {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const perc = Math.max(0, Math.min(1, x / rect.width));
                 const dur = Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : getDurationSeconds();
                 if (dur > 0) {
                     audioRef.current.currentTime = dur * perc;
                     setProgress(perc * 100);
                 }
             }
        }}>
            {/* Background Bars */}
            <div className="flex items-end space-x-0.5 h-full absolute inset-0 opacity-40">
                {[4, 8, 5, 12, 16, 10, 6, 9, 14, 8, 5, 12, 10, 7, 13, 15, 11, 4, 6, 8, 12, 5].map((h, i) => (
                    <div key={i} className="flex-1 bg-current rounded-full transition-all" style={{ height: `${h}px` }} />
                ))}
            </div>
            {/* Active Progress Mask */}
            <div className="flex items-end space-x-0.5 h-full absolute inset-0 overflow-hidden transition-all duration-100" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}>
                 {[4, 8, 5, 12, 16, 10, 6, 9, 14, 8, 5, 12, 10, 7, 13, 15, 11, 4, 6, 8, 12, 5].map((h, i) => (
                    <div key={i} className="flex-1 bg-current rounded-full" style={{ height: `${h}px`, minWidth: '4px' }} />
                ))}
            </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-[12px] font-medium">{message.duration || '0:00'}</span>
        </div>
      </div>

      <div className="flex flex-col items-end self-end ml-1 space-y-1">
         <div className="flex items-center space-x-1">
            <span className="text-[10px] text-white/70">{message.timestamp}</span>
            {isOutgoing && (
              <div className="text-white/70">
                {message.isRead ? <CheckCheck size={12} /> : <Check size={12} />}
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default VoiceMessage;
