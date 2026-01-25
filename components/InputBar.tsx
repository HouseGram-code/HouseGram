
import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Mic, Send, Trash2, StopCircle, Keyboard, Image, FileText, Music, Headphones, Loader2 } from 'lucide-react';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { useLanguage } from '../LanguageContext.tsx';
import { Message } from '../types.ts';
import { storage } from '../firebase.ts';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface InputBarProps {
  onSend: (text: string, type: Message['type'], mediaUrl?: string, meta?: string) => void;
  storageUsage: number;
  onFileUpload: (size: number, category: 'media' | 'files' | 'voice') => void;
}

const InputBar: React.FC<InputBarProps> = ({ onSend, storageUsage, onFileUpload }) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);

  // File Inputs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

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
      if (attachRef.current && !attachRef.current.contains(event.target as Node)) {
        if (!(event.target as HTMLElement).closest('.attach-toggle-btn')) {
          setShowAttach(false);
        }
      }
    };

    if (showEmoji || showAttach) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmoji, showAttach]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uploadToFirebase = async (file: File | Blob, folder: string): Promise<string> => {
    const filename = `${folder}/${Date.now()}_${(Math.random() * 1000).toFixed(0)}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const startRecording = async () => {
    setShowEmoji(false);
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

  const handleSendText = () => {
    if (text.trim()) {
      onSend(text, 'text');
      setText('');
      setShowEmoji(false);
      setShowAttach(false);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'file' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setShowAttach(false);

    try {
        const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        let msgType: Message['type'] = 'file';
        let category: 'media' | 'files' | 'voice' = 'files';
        let folder = 'files';

        if (type === 'media') {
            category = 'media';
            folder = 'media';
            if (file.type.startsWith('image/')) msgType = 'image';
            else if (file.type.startsWith('video/')) msgType = 'video';
        } else if (type === 'audio') {
            msgType = 'audio';
            category = 'files';
            folder = 'audio';
        }

        const url = await uploadToFirebase(file, folder);
        onSend(file.name, msgType, url, sizeStr);
        onFileUpload(file.size, category);

        // Reset inputs
        if (galleryInputRef.current) galleryInputRef.current.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (musicInputRef.current) musicInputRef.current.value = '';

    } catch (e) {
        console.error(e);
        alert("Upload failed.");
    } finally {
        setIsUploading(false);
    }
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

  const hasText = text.trim().length > 0;
  const showSendText = hasText;
  const showSendVoice = !!audioBlob; 
  const showMic = !hasText && !isRecording && !audioBlob;
  const showStop = isRecording;

  return (
    <div className="z-20 bg-tg-sidebar px-2 py-2 pb-safe flex items-center space-x-2 border-t border-tg-border/50 relative shrink-0 w-full">
      
      <input type="file" ref={galleryInputRef} onChange={(e) => handleFileSelect(e, 'media')} className="hidden" accept="image/*,video/*" />
      <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
      <input type="file" ref={musicInputRef} onChange={(e) => handleFileSelect(e, 'audio')} className="hidden" accept="audio/*" />

      {showEmoji && (
        <div ref={pickerRef} className="absolute bottom-[60px] left-0 right-0 z-50 animate-form-entrance shadow-2xl overflow-hidden mx-auto w-full max-w-md px-2">
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
        <div ref={attachRef} className="absolute bottom-[60px] right-2 z-50 animate-form-entrance origin-bottom-right bg-[#17212B] border border-tg-border rounded-xl shadow-2xl overflow-hidden w-48 py-2">
          <button onClick={() => galleryInputRef.current?.click()} className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center"><Image size={18} /></div><span className="text-white font-medium">Photo or Video</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center"><FileText size={18} /></div><span className="text-white font-medium">File</span>
          </button>
          <button onClick={() => musicInputRef.current?.click()} className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center"><Headphones size={18} /></div><span className="text-white font-medium">Music</span>
          </button>
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
            <button onClick={() => setShowEmoji(!showEmoji)} className={`emoji-toggle-btn p-1 transition-colors hover:text-tg-accent shrink-0 ${showEmoji ? 'text-tg-accent' : 'text-tg-secondary'}`}>
              {showEmoji ? <Keyboard size={24} /> : <Smile size={24} />}
            </button>
            <input type="text" placeholder={t('message')} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 bg-transparent text-white placeholder-tg-secondary focus:outline-none text-[16px] py-2 min-w-0" />
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
                    <button onClick={handleSendText} className="w-12 h-12 bg-tg-accent rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"><Send size={20} className="text-white ml-0.5 mt-0.5" fill="white" /></button>
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
  );
};

export default InputBar;
