
import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Mic, Send, Trash2, StopCircle, Keyboard, Image, FileText, Music, Headphones, Loader2, Gamepad2, Calendar, Clock, X, Sticker, Gift as GiftIcon } from 'lucide-react';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { useLanguage } from '../LanguageContext.tsx';
import { Message } from '../types.ts';
import { storage } from '../firebase.ts';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface InputBarProps {
  onSend: (text: string, type: Message['type'], mediaUrl?: string, meta?: string, scheduledTime?: number) => void;
  storageUsage: number;
  onFileUpload: (size: number, category: 'media' | 'files' | 'voice') => void;
  onTyping?: () => void;
  onGiftClick?: () => void;
}

const InputBar: React.FC<InputBarProps> = ({ onSend, storageUsage, onFileUpload, onTyping, onGiftClick }) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  
  // Schedule Logic
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recording State
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

  // File Inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  const MEME_GIFS = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHl5eGlxODl5bHIzYm16YnZ6aW14eGp6MTRmb2V6bm85YjB2Nm15bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Ju7l5y9osyymQ/giphy.gif', // Rick Roll
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6aW14eGp6MTRmb2V6bm85YjB2Nm15bWh0Z254ZWF0Znd5Yzl5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Cmr1OMJ2FN0B2/giphy.gif', // Vibing Cat
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHl5eGlxODl5bHIzYm16YnZ6aW14eGp6MTRmb2V6bm85YjB2Nm15bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QMHoU66sBXqqLqYvGO/giphy.gif', // This is Fine
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXNtaW14eGp6MTRmb2V6bm85YjB2Nm15bHk0Z254ZWF0Znd5Yzl5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BPJmthQ3YRwD6QqcVD/giphy.gif', // Cheers
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHl5eGlxODl5bHIzYm16YnZ6aW14eGp6MTRmb2V6bm85YjB2Nm15bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2K5jinAlChoCLS/giphy.gif', // Confused Lady
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Close popups when clicking outside
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

      // Trigger typing event with debounce/throttle logic
      if (newVal.length > 0 && onTyping) {
         if (!typingTimeoutRef.current) {
             onTyping();
             // Prevent spamming writes
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

  // Helper: Compress Image to max 1280px and 0.8 quality JPEG
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
        // Only compress images
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
                const MAX_SIZE = 1280;

                // Calculate new dimensions
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
                if (!ctx) {
                    resolve(file); // Fallback
                    return;
                }
                
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create new file from blob
                        const newFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', 0.85); // 85% quality
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
  };

  const uploadToFirebase = async (file: File | Blob, folder: string): Promise<string> => {
    // Generate simple filename to avoid path issues
    const ext = file instanceof File ? file.name.split('.').pop() : 'webm';
    const filename = `${folder}/${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
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
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const type = 'audio/webm'; 
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 0) setAudioBlob(blob);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
    setAudioBlob(null);
    setRecordingDuration(0);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSendText = (scheduledTime?: number) => {
    if (text.trim()) {
      onSend(text, 'text', undefined, undefined, scheduledTime);
      setText('');
      setShowEmoji(false);
      setShowStickers(false);
      setShowAttach(false);
      setShowSendMenu(false);
      setShowScheduleModal(false);
    }
  };

  const handleSendVoice = async () => {
    if (audioBlob) {
        setIsUploading(true);
        try {
            const url = await uploadToFirebase(audioBlob, 'voice');
            onSend('', 'voice', url, formatDuration(recordingDuration));
            onFileUpload(audioBlob.size, 'voice');
            setAudioBlob(null);
            setRecordingDuration(0);
        } catch (e) {
            console.error(e);
            alert("Failed to upload voice message.");
        } finally {
            setIsUploading(false);
        }
    }
  };

  const handleGifSend = (url: string) => {
      onSend('', 'image', url);
      setShowStickers(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'file' | 'audio') => {
    e.preventDefault();
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Reset input
    e.target.value = '';

    setIsUploading(true);
    setShowAttach(false);
    setShowStickers(false);

    try {
        let fileToUpload = rawFile;
        
        // Compress if it's an image
        if (type === 'media' && rawFile.type.startsWith('image/')) {
            fileToUpload = await compressImage(rawFile);
        }

        const sizeStr = (fileToUpload.size / 1024 / 1024).toFixed(2) + ' MB';
        let msgType: Message['type'] = 'file';
        let category: 'media' | 'files' | 'voice' = 'files';
        let folder = 'files';

        if (type === 'media') {
            category = 'media';
            folder = 'media';
            if (fileToUpload.type.startsWith('image/')) msgType = 'image';
            else if (fileToUpload.type.startsWith('video/')) msgType = 'video';
        } else if (type === 'audio') {
            msgType = 'audio';
            category = 'files';
            folder = 'audio';
        }

        const url = await uploadToFirebase(fileToUpload, folder);
        
        if (url) {
            onSend(rawFile.name, msgType, url, sizeStr);
            onFileUpload(fileToUpload.size, category);
        } else {
            throw new Error("Upload failed (empty URL)");
        }

    } catch (e) {
        console.error("File upload error:", e);
        alert("Upload failed. Please try again.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleGameSelect = (emoji: string) => {
      onSend(emoji, 'text');
      setShowAttach(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // --- Long Press Logic ---
  const handleSendMouseDown = () => {
    longPressTimerRef.current = setTimeout(() => {
        setShowSendMenu(true);
    }, 500); // 500ms long press
  };

  const handleSendMouseUp = () => {
    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        if (!showSendMenu) {
             handleSendText();
        }
    }
  };

  const handleSendTouchStart = () => {
      handleSendMouseDown();
  };

  const handleSendTouchEnd = (e: React.TouchEvent) => {
      e.preventDefault(); // Prevent click event
      handleSendMouseUp();
  };
  
  const openScheduleModal = () => {
      setShowSendMenu(false);
      setScheduleDate(new Date(Date.now() + 600000)); // Default 10 mins later
      setShowScheduleModal(true);
  };
  
  const handleScheduleConfirm = () => {
      handleSendText(scheduleDate.getTime());
  };

  const hasText = text.trim().length > 0;
  const showSendText = hasText;
  const showSendVoice = !!audioBlob; 
  const showMic = !hasText && !isRecording && !audioBlob;
  const showStop = isRecording;

  return (
    <>
      <div className="z-20 bg-tg-sidebar px-2 pt-2 pb-safe flex items-center space-x-2 border-t border-tg-border/50 relative shrink-0 w-full">
        
        {/* Hidden Inputs with Correct Accept Types */}
        <input 
            type="file" 
            ref={galleryInputRef} 
            onChange={(e) => handleFileSelect(e, 'media')} 
            className="hidden" 
            accept="image/*,video/*" 
        />
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFileSelect(e, 'file')} 
            className="hidden" 
        />
        <input 
            type="file" 
            ref={musicInputRef} 
            onChange={(e) => handleFileSelect(e, 'audio')} 
            className="hidden" 
            accept="audio/*" 
        />

        {/* Schedule Menu Popover */}
        {showSendMenu && (
            <div ref={sendMenuRef} className="absolute bottom-[70px] right-2 z-50 animate-emoji-pop bg-[#1c242f] rounded-xl shadow-2xl border border-tg-border overflow-hidden min-w-[200px]">
                <button 
                    onClick={openScheduleModal}
                    className="w-full text-left px-4 py-3 text-white hover:bg-white/5 transition-colors flex items-center space-x-3"
                >
                    <Calendar size={18} className="text-tg-accent" />
                    <span className="font-medium">Schedule Message</span>
                </button>
            </div>
        )}

        {/* Sticker/GIF Picker */}
        {showStickers && (
            <div ref={stickerRef} className="absolute bottom-[80px] left-0 right-0 z-50 animate-form-entrance shadow-2xl overflow-hidden mx-auto w-full max-w-md px-2">
                <div className="bg-[#17212B] border border-tg-border rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-tg-border/50 bg-[#1c242f]">
                        <h3 className="text-white text-sm font-bold flex items-center gap-2">
                            <Sticker size={16} className="text-tg-accent" />
                            Trending GIFs
                        </h3>
                    </div>
                    <div className="p-2 grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
                        {MEME_GIFS.map((url, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleGifSend(url)}
                                className="aspect-square rounded-lg overflow-hidden relative group border border-white/5 hover:border-tg-accent/50 transition-all"
                            >
                                <img src={url} alt="GIF" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {showEmoji && (
          <div ref={pickerRef} className="absolute bottom-[80px] left-0 right-0 z-50 animate-form-entrance shadow-2xl overflow-hidden mx-auto w-full max-w-md px-2">
            <EmojiPicker 
              onEmojiClick={onEmojiClick} 
              theme={Theme.DARK} 
              emojiStyle={EmojiStyle.APPLE} 
              searchDisabled={false} 
              width="100%"
              height={350} 
              lazyLoadEmojis={true} 
              previewConfig={{ showPreview: false }} 
              style={{ 
                // @ts-ignore
                '--epr-bg-color': '#17212B', '--epr-category-label-bg-color': '#17212B', '--epr-text-color': '#ffffff', '--epr-picker-border-color': '#0E1621', '--epr-search-input-bg-color': '#0E1621', '--epr-search-input-text-color': '#ffffff', '--epr-hover-bg-color': 'rgba(255,255,255,0.05)', '--epr-focus-bg-color': 'rgba(255,255,255,0.1)', border: '1px solid #0E1621', borderRadius: '16px' 
              }} 
            />
          </div>
        )}

        {showAttach && (
          <div ref={attachRef} className="absolute bottom-[80px] right-2 z-50 animate-form-entrance origin-bottom-right bg-[#17212B] border border-tg-border rounded-xl shadow-2xl overflow-hidden w-48 py-2">
            <button onClick={() => galleryInputRef.current?.click()} className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center"><Image size={18} /></div><span className="text-white font-medium">Photo or Video</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center"><FileText size={18} /></div><span className="text-white font-medium">File</span>
            </button>
            <button onClick={() => musicInputRef.current?.click()} className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center"><Headphones size={18} /></div><span className="text-white font-medium">Music</span>
            </button>
            
            {onGiftClick && (
                <button onClick={() => { onGiftClick(); setShowAttach(false); }} className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center"><GiftIcon size={18} /></div><span className="text-white font-medium">Gift</span>
                </button>
            )}

            <div className="h-px bg-white/5 my-1 mx-4" />
            <div className="px-4 py-2 text-xs font-bold text-tg-secondary uppercase tracking-wider">Games</div>
            
            <div className="grid grid-cols-3 gap-2 px-2 pb-2">
               <button onClick={() => handleGameSelect('🏀')} className="p-2 hover:bg-white/5 rounded-lg text-2xl flex justify-center transition-colors">🏀</button>
               <button onClick={() => handleGameSelect('🎲')} className="p-2 hover:bg-white/5 rounded-lg text-2xl flex justify-center transition-colors">🎲</button>
               <button onClick={() => handleGameSelect('🎯')} className="p-2 hover:bg-white/5 rounded-lg text-2xl flex justify-center transition-colors">🎯</button>
            </div>
          </div>
        )}

        <div className="flex-1 bg-tg-bg rounded-[16px] flex items-center px-3 py-1 space-x-2 transition-shadow focus-within:shadow-lg border border-transparent focus-within:border-tg-accent/20 h-[46px] min-w-0">
          {isRecording ? (
            <div className="flex-1 flex items-center space-x-3 animate-fadeIn px-2 min-w-0">
               <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0" />
               <span className="text-white font-mono font-medium text-lg shrink-0">{formatDuration(recordingDuration)}</span>
               <span className="text-tg-secondary text-sm ml-2 truncate">{t('recording') || 'Recording...'}</span>
            </div>
          ) : audioBlob ? (
            <div className="flex-1 flex items-center justify-between animate-fadeIn px-2 min-w-0">
                <div className="flex items-center space-x-3 min-w-0">
                   <Mic size={20} className="text-tg-accent shrink-0" />
                   <span className="text-white font-medium text-sm truncate">Voice ({formatDuration(recordingDuration)})</span>
                </div>
                <button onClick={cancelRecording} className="p-1 hover:bg-white/10 rounded-full text-red-400 transition-colors shrink-0">
                   <Trash2 size={20} />
                </button>
            </div>
          ) : (
            <>
              <button onClick={() => { setShowEmoji(!showEmoji); setShowStickers(false); }} className={`emoji-toggle-btn p-1 transition-colors hover:text-tg-accent shrink-0 ${showEmoji ? 'text-tg-accent' : 'text-tg-secondary'}`}>
                {showEmoji ? <Keyboard size={24} /> : <Smile size={24} />}
              </button>
              
              <button onClick={() => { setShowStickers(!showStickers); setShowEmoji(false); }} className={`sticker-toggle-btn p-1 transition-colors hover:text-tg-accent shrink-0 ${showStickers ? 'text-tg-accent' : 'text-tg-secondary'}`}>
                 <Sticker size={24} />
              </button>

              <input type="text" placeholder={t('message')} value={text} onChange={handleTextChange} onKeyDown={handleKeyDown} className="flex-1 bg-transparent text-white placeholder-tg-secondary focus:outline-none text-[16px] py-2 min-w-0" />
              <button onClick={() => setShowAttach(!showAttach)} className={`attach-toggle-btn p-1 transition-colors hover:text-tg-accent transform duration-200 shrink-0 ${showAttach ? 'text-tg-accent rotate-45' : 'text-tg-secondary'}`}>
                <Paperclip size={22} className={showAttach ? "" : "rotate-45"} />
              </button>
            </>
          )}
        </div>

        <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
           {isUploading ? (
               <div className="absolute inset-0 flex items-center justify-center">
                   <Loader2 className="animate-spin text-tg-accent" />
               </div>
           ) : (
              <>
                  <div className={`absolute transition-all duration-200 ${showSendText ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
                      <button 
                          onMouseDown={handleSendMouseDown}
                          onMouseUp={handleSendMouseUp}
                          onTouchStart={handleSendTouchStart}
                          onTouchEnd={handleSendTouchEnd}
                          onContextMenu={(e) => e.preventDefault()}
                          className="w-12 h-12 bg-tg-accent rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
                        >
                          <Send size={20} className="text-white ml-0.5 mt-0.5" fill="white" />
                      </button>
                  </div>
                  <div className={`absolute transition-all duration-200 ${showSendVoice ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
                      <button onClick={handleSendVoice} className="w-12 h-12 bg-tg-accent rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"><Send size={20} className="text-white ml-0.5 mt-0.5" fill="white" /></button>
                  </div>
                  <div className={`absolute transition-all duration-200 ${showStop ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
                      <button onClick={stopRecording} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"><StopCircle size={24} className="text-white" fill="white" /></button>
                  </div>
                  <div className={`absolute transition-all duration-200 ${showMic ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
                      <button onClick={startRecording} className="w-12 h-12 bg-[#232e3c] rounded-full flex items-center justify-center transition-colors active:scale-90"><Mic size={24} className="text-tg-accent" /></button>
                  </div>
              </>
           )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)} />
            <div className="relative w-full max-w-sm bg-[#1c242f] border border-white/10 rounded-2xl p-6 shadow-2xl animate-form-entrance flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-tg-accent/20 flex items-center justify-center text-tg-accent mb-4">
                    <Calendar size={24} />
                </div>
                <h3 className="text-white text-lg font-bold mb-1">Schedule Message</h3>
                <p className="text-tg-secondary text-sm mb-6 text-center">Select a date and time to send this message.</p>

                {/* Custom Date Picker UI */}
                <div className="w-full bg-black/20 rounded-xl p-4 border border-white/5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-tg-secondary text-sm font-bold uppercase tracking-wide">Date & Time</span>
                        <Clock size={16} className="text-tg-accent" />
                    </div>
                    <input 
                        type="datetime-local" 
                        value={new Date(scheduleDate.getTime() - (scheduleDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
                        onChange={(e) => {
                            const d = new Date(e.target.value);
                            setScheduleDate(d);
                        }}
                        className="w-full bg-transparent text-white text-xl font-mono focus:outline-none [color-scheme:dark]"
                    />
                </div>

                <button 
                    onClick={handleScheduleConfirm}
                    className="w-full py-3.5 bg-tg-accent rounded-xl text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-tg-accent/20"
                >
                    Send on {scheduleDate.toLocaleDateString()} at {scheduleDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </button>
                 <button 
                    onClick={() => setShowScheduleModal(false)}
                    className="mt-3 text-tg-secondary text-sm font-medium hover:text-white transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
      )}
    </>
  );
};

export default InputBar;
