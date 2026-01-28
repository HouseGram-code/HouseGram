
import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Mic, Send, Trash2, StopCircle, Keyboard, Image, FileText, Headphones, Loader2, Clock, X, Sticker } from 'lucide-react';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { useLanguage } from '../LanguageContext.tsx';
import { Message } from '../types.ts';
import { API_KEY, API_URL, UPLOAD_API_URL } from '../constants.ts';

interface InputBarProps {
  onSend: (text: string, type: Message['type'], mediaUrl?: string, meta?: string, scheduledTime?: number) => void;
  storageUsage: number;
  onFileUpload: (size: number, category: 'media' | 'files' | 'voice') => void;
  onTyping?: () => void;
}

const InputBar: React.FC<InputBarProps> = ({ onSend, storageUsage, onFileUpload, onTyping }) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const sendMenuRef = useRef<HTMLDivElement>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  const MEME_GIFS = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHl5eGlxODl5bHIzYm16YnZ6aW14eGp6MTRmb2V6bm85YjB2Nm15bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Ju7l5y9osyymQ/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6aW14eGp6MTRmb2V6bm85YjB2Nm15bWh0Z254ZWF0Znd5Yzl5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Cmr1OMJ2FN0B2/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHl5eGlxODl5bHIzYm16YnZ6aW14eGp6MTRmb2V6bm85YjB2Nm15bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QMHoU66sBXqqLqYvGO/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXNtaW14eGp6MTRmb2V6bm85YjB2Nm15bHk0Z254ZWF0Znd5Yzl5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BPJmthQ3YRwD6QqcVD/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHl5eGlxODl5bHIzYm16YnZ6aW14eGp6MTRmb2V6bm85YjB2Nm15bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2K5jinAlChoCLS/giphy.gif',
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        if (!(event.target as HTMLElement).closest('.emoji-toggle-btn')) {
          setShowEmoji(false);
        }
      }
      if (stickerRef.current && !stickerRef.current.contains(event.target as Node)) {
        if (!(event.target as HTMLElement).closest('.sticker-toggle-btn')) {
          setShowStickers(false);
        }
      }
      if (attachRef.current && !attachRef.current.contains(event.target as Node)) {
        if (!(event.target as HTMLElement).closest('.attach-toggle-btn')) {
          setShowAttach(false);
        }
      }
      if (sendMenuRef.current && !sendMenuRef.current.contains(event.target as Node)) {
          setShowSendMenu(false);
      }
    };

    if (showEmoji || showAttach || showSendMenu || showStickers) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmoji, showAttach, showSendMenu, showStickers]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      setText(newVal);
      if (newVal.length > 0 && onTyping) {
         if (!typingTimeoutRef.current) {
             onTyping();
             typingTimeoutRef.current = setTimeout(() => {
                 typingTimeoutRef.current = null;
             }, 2000); 
         }
      }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const postToMeshApi = async (name: string, url: string, size: number) => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'apikey': API_KEY
        },
        body: JSON.stringify({ name, url, size })
      });
    } catch (e) {
      // Silent fail
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
        if (!file.type.match(/image.*/)) {
            resolve(file);
            return;
        }
        const img = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 1024; 
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(file); return; }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        }));
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', 0.6);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file: File | Blob): Promise<string> => {
    if (file.size > 3.5 * 1024 * 1024) {
      throw new Error('File is too large for cloud storage (max 3.5MB)');
    }

    const formData = new FormData();
    const fileName = file instanceof File ? file.name : `voice_${Date.now()}.webm`;
    formData.append('file', file, fileName);

    const response = await fetch(UPLOAD_API_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Upload failed (${response.status}): ${errorText || 'Unknown error'}`);
    }

    const data = await response.json();
    if (data.success && data.url) {
        return data.url;
    } else {
        throw new Error(data.error || 'Upload was not successful');
    }
  };

  const startRecording = async () => {
    setShowEmoji(false);
    setShowStickers(false);
    setShowAttach(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      if (cancel) {
        setAudioBlob(null);
        setRecordingDuration(0);
      }
    }
  };

  const handleSendVoice = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(audioBlob);
      const durationStr = formatDuration(recordingDuration);
      onSend('', 'voice', url, durationStr);
      onFileUpload(audioBlob.size, 'voice');
      postToMeshApi(`voice_${Date.now()}.webm`, url, audioBlob.size);
    } catch (e: any) {
      console.error("File upload error:", e);
      alert(e.message || "Failed to upload voice message.");
    } finally {
      setIsUploading(false);
      setAudioBlob(null);
      setRecordingDuration(0);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let fileToUpload = file;
      if (type === 'image') {
        fileToUpload = await compressImage(file);
      }
      const url = await uploadFile(fileToUpload);
      const category = (type === 'image' || type === 'video') ? 'media' : (type === 'audio' ? 'voice' : 'files');
      const meta = type === 'audio' ? '0:00' : `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`;
      
      onSend(file.name, type, url, meta);
      onFileUpload(fileToUpload.size, category as any);
      postToMeshApi(file.name, url, fileToUpload.size);
    } catch (e: any) {
      console.error("File upload error:", e);
      alert(e.message || "Failed to upload file. Please ensure it is under 3.5MB.");
    } finally {
      setIsUploading(false);
      setShowAttach(false);
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text, 'text');
      setText('');
      setShowEmoji(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLongPress = () => {
      setShowSendMenu(true);
  };

  const onTouchStart = () => {
      if (text.trim()) {
          longPressTimerRef.current = setTimeout(handleLongPress, 600);
      }
  };

  const onTouchEnd = () => {
      if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
      }
  };

  return (
    <div className="z-20 bg-tg-sidebar px-2 py-2 flex flex-col border-t border-black/5 dark:border-white/5 pb-safe">
      {/* Schedule Modal */}
      {showScheduleModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 animate-fadeIn">
              <div className="bg-tg-sidebar w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                      <Clock size={20} className="mr-2 text-tg-accent" />
                      Schedule Message
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-tg-secondary font-bold uppercase mb-1 block">Send Date/Time</label>
                          <input 
                            type="datetime-local" 
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                            onChange={(e) => setScheduleDate(new Date(e.target.value))}
                          />
                      </div>
                  </div>
                  <div className="flex space-x-3 mt-8">
                      <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 text-tg-secondary font-bold">Cancel</button>
                      <button 
                        onClick={() => {
                            onSend(text, 'text', undefined, undefined, scheduleDate.getTime());
                            setText('');
                            setShowScheduleModal(false);
                        }}
                        className="flex-1 py-3 bg-tg-accent text-white font-bold rounded-xl shadow-lg"
                      >
                          Schedule
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Stickers Panel */}
      {showStickers && (
          <div ref={stickerRef} className="absolute bottom-[70px] left-4 right-4 h-64 bg-tg-sidebar border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-form-entrance">
              <div className="p-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-tg-secondary uppercase tracking-widest">Trending Stickers</span>
                  <button onClick={() => setShowStickers(false)}><X size={18} className="text-tg-secondary" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-4 no-scrollbar">
                  {MEME_GIFS.map((url, i) => (
                      <div 
                        key={i} 
                        onClick={() => { onSend('', 'image', url); setShowStickers(false); }}
                        className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-110 transition-transform active:scale-95 bg-black/5"
                      >
                          <img src={url} className="w-full h-full object-cover" alt="sticker" />
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Attach Menu */}
      {showAttach && (
          <div ref={attachRef} className="absolute bottom-[70px] left-4 w-64 bg-tg-sidebar border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-form-entrance">
              <button onClick={() => galleryInputRef.current?.click()} className="w-full px-5 py-3.5 flex items-center space-x-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white"><Image size={20} /></div>
                  <span className="text-tg-text font-medium">Photo or Video</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full px-5 py-3.5 flex items-center space-x-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white"><FileText size={20} /></div>
                  <span className="text-tg-text font-medium">File</span>
              </button>
              <button onClick={() => musicInputRef.current?.click()} className="w-full px-5 py-3.5 flex items-center space-x-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white"><Headphones size={20} /></div>
                  <span className="text-tg-text font-medium">Music</span>
              </button>
          </div>
      )}

      {/* Input Row */}
      <div className="flex items-end space-x-2 w-full max-w-[1200px] mx-auto">
        <div className="flex-1 bg-[#17212B]/80 dark:bg-[#17212B] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-[24px] flex items-end px-2 py-1.5 shadow-sm min-h-[48px] transition-colors focus-within:border-tg-accent/30 focus-within:bg-[#1c242f]">
          
          <button 
            className="p-2.5 text-tg-secondary hover:text-tg-accent transition-colors active:scale-90 emoji-toggle-btn rounded-full hover:bg-white/5"
            onClick={() => { setShowEmoji(!showEmoji); setShowStickers(false); setShowAttach(false); }}
          >
            {showEmoji ? <Keyboard size={24} /> : <Smile size={24} />}
          </button>
          
          <input 
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Recording...' : (audioBlob ? 'Voice Ready' : t('message'))}
            disabled={isRecording}
            className="flex-1 bg-transparent text-tg-text py-2.5 px-2 outline-none text-[16px] placeholder-tg-secondary/70"
          />

          <button 
            className="p-2.5 text-tg-secondary hover:text-tg-accent transition-colors active:scale-90 attach-toggle-btn rounded-full hover:bg-white/5"
            onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); setShowStickers(false); }}
          >
            <Paperclip size={24} />
          </button>

          {!text.trim() && !audioBlob && (
            <button 
              className="p-2.5 text-tg-accent/60 hover:text-tg-accent transition-colors active:scale-90 sticker-toggle-btn rounded-full hover:bg-white/5"
              onClick={() => { setShowStickers(!showStickers); setShowEmoji(false); setShowAttach(false); }}
            >
              <Sticker size={24} />
            </button>
          )}
        </div>

        {/* Send Button */}
        <div className="flex-shrink-0 relative">
          {isRecording ? (
            <div className="flex items-center space-x-2 bg-red-500 px-4 py-3 rounded-full animate-pulse-slow shadow-lg shadow-red-500/30">
                <span className="text-white font-mono text-sm">{formatDuration(recordingDuration)}</span>
                <button onClick={() => stopRecording(false)} className="bg-white/20 p-1.5 rounded-full hover:bg-white/30"><StopCircle size={18} className="text-white" /></button>
                <button onClick={() => stopRecording(true)} className="bg-white/20 p-1.5 rounded-full hover:bg-white/30"><Trash2 size={18} className="text-white" /></button>
            </div>
          ) : audioBlob ? (
            <div className="flex items-center space-x-2">
                <button onClick={() => setAudioBlob(null)} className="p-3 text-red-500 bg-red-500/10 rounded-full hover:bg-red-500/20 transition-colors"><Trash2 size={24} /></button>
                <button onClick={handleSendVoice} disabled={isUploading} className="w-[52px] h-[52px] bg-gradient-to-b from-tg-accent to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-90 transition-transform">{isUploading ? <Loader2 className="animate-spin" /> : <Send size={24} fill="white" className="ml-0.5" />}</button>
            </div>
          ) : (
            <button 
                onMouseDown={onTouchStart}
                onMouseUp={onTouchEnd}
                onMouseLeave={onTouchEnd}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onClick={text.trim() ? handleSend : startRecording}
                disabled={isUploading}
                className={`w-[52px] h-[52px] ${text.trim() ? 'bg-gradient-to-b from-tg-accent to-blue-600' : 'bg-gradient-to-b from-tg-accent to-blue-600'} text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:brightness-110 active:scale-90 transition-all duration-300`}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : (text.trim() ? <Send size={24} fill="currentColor" className="ml-0.5" /> : <Mic size={24} />)}
            </button>
          )}

          {showSendMenu && (
              <div ref={sendMenuRef} className="absolute bottom-16 right-0 w-56 bg-tg-sidebar border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-form-entrance">
                  <button 
                    onClick={() => { setShowScheduleModal(true); setShowSendMenu(false); }}
                    className="w-full px-5 py-3.5 flex items-center space-x-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                      <Clock size={20} className="text-tg-accent" />
                      <span className="text-tg-text font-medium">Schedule Message</span>
                  </button>
              </div>
          )}
        </div>
      </div>

      {showEmoji && (
        <div ref={pickerRef} className="mt-2 animate-fadeIn">
          <EmojiPicker 
            theme={Theme.DARK} 
            emojiStyle={EmojiStyle.APPLE} 
            width="100%" 
            height={350} 
            onEmojiClick={(e) => setText(prev => prev + e.emoji)} 
            lazyLoadEmojis={true}
          />
        </div>
      )}

      {/* Hidden Inputs */}
      <input type="file" ref={galleryInputRef} onChange={(e) => handleMediaUpload(e, 'image')} className="hidden" accept="image/*,video/*" />
      <input type="file" ref={fileInputRef} onChange={(e) => handleMediaUpload(e, 'file')} className="hidden" />
      <input type="file" ref={musicInputRef} onChange={(e) => handleMediaUpload(e, 'audio')} className="hidden" accept="audio/*" />
    </div>
  );
};

export default InputBar;
