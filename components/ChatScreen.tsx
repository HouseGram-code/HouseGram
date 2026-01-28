
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Ban, BadgeCheck, ShieldCheck, Bookmark, MoreVertical, Wallpaper, Check, CheckCheck, Loader2, ImagePlus, User as UserIcon, Calendar, Zap, X, FlaskConical } from 'lucide-react';
import { Chat, Message, User, formatLastSeen } from '../types.ts';
import MessageBubble from './MessageBubble.tsx';
import VoiceMessage from './VoiceMessage.tsx';
import InputBar from './InputBar.tsx';
import { useLanguage } from '../LanguageContext.tsx';
import { db } from '../firebase.ts';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { UPLOAD_API_URL } from '../constants.ts';

interface ChatScreenProps {
  chat: Chat;
  currentUser: User;
  isBlocked: boolean;
  onBack: () => void;
  onOpenUserInfo: (user: User) => void;
  storageUsage: number;
  onFileUpload: (size: number, category: 'media' | 'files' | 'voice') => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ 
    chat, currentUser, isBlocked, onBack, onOpenUserInfo, storageUsage, onFileUpload 
}) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [liveChatUser, setLiveChatUser] = useState<User>(chat.user);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  
  const [viewingGiftMessage, setViewingGiftMessage] = useState<Message | null>(null);

  const [currentWallpaper, setCurrentWallpaper] = useState<string>('');
  const [tempWallpaper, setTempWallpaper] = useState<string | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [showApplyOptions, setShowApplyOptions] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const isSavedMessages = chat.id === `saved_${currentUser.id}`;
  const isChannel = chat.type === 'channel';

  const WALLPAPERS = [
      { id: 'wp_default', bg: '', name: 'Default' },
      { id: 'wp_1', bg: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900', name: 'Nebula' },
      { id: 'wp_2', bg: 'bg-[url("https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop")] bg-cover bg-center', name: 'Waves' },
      { id: 'wp_3', bg: 'bg-[url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop")] bg-cover bg-center', name: 'Forest' },
      { id: 'wp_4', bg: 'bg-[url("https://images.unsplash.com/photo-1506318137071-a8bcbf67cc77?q=80&w=2600&auto=format&fit=crop")] bg-cover bg-center', name: 'Dark City' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!chat.user.id || chat.user.id === 'news-bot' || isSavedMessages) return;
    const userRef = doc(db, "users", chat.user.id);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            setLiveChatUser({ ...docSnap.data(), id: docSnap.id } as User);
        }
    });
    return () => unsubscribe();
  }, [chat.user.id, isSavedMessages]);

  useEffect(() => {
    if (!chat.id || chat.id === 'news-placeholder') return;
    const unsubChat = onSnapshot(doc(db, "chats", chat.id), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const localWP = localStorage.getItem(`wallpaper_${chat.id}`);
            setCurrentWallpaper(localWP || data.wallpaper || '');
            if (!showWallpaperModal) setTempWallpaper(localWP || data.wallpaper || '');
            if (data.typing && !isSavedMessages) {
                const partnerTypingTime = data.typing[chat.user.id];
                setIsPartnerTyping(partnerTypingTime && Date.now() - partnerTypingTime < 4000);
            } else {
                setIsPartnerTyping(false);
            }
        }
    });
    const msgsRef = collection(db, "chats", chat.id, "messages");
    const q = query(msgsRef, orderBy("timestampRaw", "asc"));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
        const loadedMsgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Message[];
        setMessages(loadedMsgs);
        setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
        const unreadIds: string[] = [];
        snapshot.docs.forEach(d => {
            const msg = d.data();
            if (msg.senderId !== currentUser.id && !msg.isRead) unreadIds.push(d.id);
        });
        if (unreadIds.length > 0) {
            const batch = writeBatch(db);
            unreadIds.forEach(id => batch.update(doc(db, "chats", chat.id, "messages", id), { isRead: true }));
            batch.commit().catch(console.error);
        }
    });
    return () => { unsubChat(); unsubMsgs(); };
  }, [chat.id, chat.user.id, currentUser.id, isSavedMessages]);

  const handleSendMessage = async (text: string, type: Message['type'], mediaUrl?: string, meta?: string, scheduledTime?: number) => {
    if (isBlocked || chat.isReadOnly || sending) return;
    let interactiveEmoji: Message['interactiveEmoji'] | undefined;
    const cleanText = text ? text.trim() : '';
    if (type === 'text') {
        if (cleanText === '🎲') interactiveEmoji = { type: 'dice', value: Math.floor(Math.random() * 6) + 1 };
        else if (cleanText === '🏀') interactiveEmoji = { type: 'basketball', value: Math.floor(Math.random() * 5) + 1 }; 
        else if (cleanText === '🎯') interactiveEmoji = { type: 'dart', value: Math.floor(Math.random() * 6) + 1 }; 
    }
    const tsRaw = scheduledTime || Date.now();
    const newMessageData = {
      senderId: currentUser.id || 'unknown',
      text: (type === 'file' || type === 'audio') ? null : (cleanText || null),
      timestamp: new Date(tsRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestampRaw: tsRaw,
      isRead: false,
      type: type,
      audioUrl: (type === 'voice' || type === 'audio') ? (mediaUrl || null) : null,
      duration: (type === 'voice' || type === 'audio') ? (meta || null) : null,
      mediaUrl: (type === 'image' || type === 'video' || type === 'file') ? (mediaUrl || null) : null,
      mediaSize: (type === 'file' || type === 'video' || type === 'image') ? (meta || null) : null,
      mediaName: (type === 'file' || type === 'audio') ? (text || null) : null,
      interactiveEmoji: interactiveEmoji || null,
      scheduledTimestamp: scheduledTime || null
    };
    try {
        await addDoc(collection(db, "chats", chat.id, "messages"), newMessageData);
        if (!scheduledTime) await updateDoc(doc(db, "chats", chat.id), { lastMessage: newMessageData, updatedAt: Date.now() });
    } catch (e) { console.error("Error sending message", e); }
  };

  const handleTyping = async () => {
     if (isSavedMessages || chat.isReadOnly) return;
     try { await updateDoc(doc(db, "chats", chat.id), { [`typing.${currentUser.id}`]: Date.now() }); } catch (e) {}
  };

  const handleUploadWallpaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBg(true);
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            body: formData
        });
        if(!response.ok) throw new Error(`Upload failed with status: ${response.status}`);
        const data = await response.json();
        if(!data.success) throw new Error(data.error || "Upload failed");
        setTempWallpaper(`bg-[url('${data.url}')] bg-cover bg-center`);
    } catch (e) {
        console.error("Wallpaper upload error", e);
        alert("Failed to upload wallpaper. Please try a smaller file.");
    } finally {
        setIsUploadingBg(false);
    }
  };

  const handleApplyWallpaper = async (mode: 'me' | 'both') => {
      const finalWP = tempWallpaper === null ? '' : tempWallpaper;
      if (mode === 'me') {
          localStorage.setItem(`wallpaper_${chat.id}`, finalWP);
          setCurrentWallpaper(finalWP);
      } else {
          localStorage.removeItem(`wallpaper_${chat.id}`);
          await updateDoc(doc(db, "chats", chat.id), { wallpaper: finalWP });
      }
      setShowWallpaperModal(false);
      setShowApplyOptions(false);
  };

  const statusText = isPartnerTyping ? 'typing' : (isSavedMessages ? t('cloudStorage') : (isChannel ? '' : (chat.isReadOnly ? 'service notifications' : formatLastSeen(liveChatUser, t, currentUser))));
  const isOnline = statusText === t('online');
  const activeWallpaper = tempWallpaper !== null ? tempWallpaper : currentWallpaper;
  const canSetForBoth = !isSavedMessages && !isChannel;

  return (
    <div className={`flex flex-col w-full bg-tg-bg relative overflow-hidden h-full ${currentWallpaper}`}>
       {!currentWallpaper && <div className="absolute inset-0 bg-tg-pattern bg-repeat opacity-[0.03] pointer-events-none" />}
      <div className="z-10 bg-tg-sidebar px-2 pb-2 pt-safe flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-md min-h-[60px] h-auto shrink-0 relative">
        <div className="flex items-center flex-1 overflow-hidden mr-2">
          <button onClick={onBack} className="p-3 mr-1 text-tg-text hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0 active:scale-95">
            <ArrowLeft size={22} />
          </button>
          <div onClick={() => onOpenUserInfo(liveChatUser)} className="flex items-center flex-1 cursor-pointer overflow-hidden group py-1 active:opacity-70 transition-opacity">
            {isSavedMessages ? (
                 <div className="w-10 h-10 rounded-full flex-shrink-0 bg-tg-accent flex items-center justify-center font-bold text-white shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden mr-3">
                     <Bookmark size={20} className="text-white" fill="white" />
                 </div>
            ) : (
                <div className={`w-10 h-10 rounded-full flex-shrink-0 ${liveChatUser.avatarColor} flex items-center justify-center font-bold text-white shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden mr-3`}>
                {liveChatUser.avatarUrl ? (
                    liveChatUser.isVideoAvatar ? (<video src={liveChatUser.avatarUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : (<img src={liveChatUser.avatarUrl} alt="" className="w-full h-full object-cover" />)
                ) : (liveChatUser.name.charAt(0))}
                </div>
            )}
            <div className="flex flex-col overflow-hidden justify-center">
              <span className="text-tg-text font-bold text-[16px] leading-tight truncate flex items-center">
                {isSavedMessages ? t('saved') : liveChatUser.name}
                {!isSavedMessages && (
                    <>
                        {liveChatUser.isAdmin ? (<ShieldCheck size={14} className="ml-1 text-amber-500 shrink-0" fill="currentColor" stroke="black" strokeWidth={1} />) : (chat.isReadOnly || liveChatUser.isOfficial ? (<BadgeCheck size={14} className="ml-1 text-tg-accent shrink-0" fill="#2AABEE" stroke="white" />) : null)}
                        {liveChatUser.isTester && (<div className="ml-1 bg-purple-500/10 border border-purple-500/20 rounded-full p-0.5" title="Beta Tester"><FlaskConical size={12} className="text-purple-500" /></div>)}
                    </>
                )}
              </span>
              {isPartnerTyping ? (
                 <div className="text-tg-accent text-[13px] truncate leading-tight font-medium animate-pulse flex items-center">
                    typing
                    <span className="flex space-x-0.5 items-end ml-1 mb-0.5">
                       <span className="w-1 h-1 bg-tg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-1 h-1 bg-tg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-1 h-1 bg-tg-accent rounded-full animate-bounce"></span>
                    </span>
                 </div>
              ) : statusText ? (
                 <span className={`text-[13px] truncate leading-tight ${isOnline && !isSavedMessages ? 'text-tg-online' : 'text-tg-secondary'}`}>{statusText}</span>
              ) : null}
            </div>
          </div>
        </div>
        {!isChannel && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 text-tg-secondary hover:text-tg-text hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all active:scale-95 ${isMenuOpen ? 'bg-black/5 dark:bg-white/5 text-tg-text' : ''}`}>
                <MoreVertical size={22} />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-tg-sidebar border border-black/5 dark:border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn origin-top-right">
                    <button onClick={() => { setShowWallpaperModal(true); setIsMenuOpen(false); setTempWallpaper(currentWallpaper); }} className="w-full px-4 py-3 text-left text-tg-text hover:bg-black/5 dark:hover:bg-white/5 flex items-center space-x-3 transition-colors">
                        <Wallpaper size={18} className="text-tg-accent" />
                        <span>Change Wallpaper</span>
                    </button>
                </div>
            )}
          </div>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 relative z-0 flex flex-col pb-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 space-y-4 select-none pb-12">
            <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/5">
              {isSavedMessages ? <Bookmark size={48} className="text-tg-text" /> : <MessageCircle size={48} className="text-tg-text" />}
            </div>
            <div className="text-center px-4">
              <p className="text-tg-text font-bold text-lg mb-1">{isSavedMessages ? t('saved') : t('noMessages')}</p>
              <p className="text-sm text-tg-secondary">{isSavedMessages ? 'Store messages, media, and files here.' : t('noMessagesSub')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="self-center bg-tg-sidebar/60 backdrop-blur-md text-[12px] font-medium px-3 py-1 rounded-full text-tg-text/70 border border-black/5 dark:border-white/5 my-2 shadow-sm">{t('today')}</div>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} animate-fadeIn w-full`}>
                {(msg.type === 'voice' || msg.type === 'audio') ? (<VoiceMessage message={msg} isOutgoing={msg.senderId === currentUser.id} />) : (<MessageBubble message={msg} isOutgoing={msg.senderId === currentUser.id} onViewGift={(m) => setViewingGiftMessage(m)} />)}
              </div>
            ))}
          </>
        )}
      </div>
      {isBlocked ? (
        <div className="z-10 bg-tg-sidebar px-4 py-4 flex items-center justify-center space-x-2 border-t border-black/5 dark:border-white/5 text-red-400 font-medium pb-safe"><Ban size={18} /><span>{t('userBlockedMsg')}</span></div>
      ) : chat.isReadOnly ? (
        <div className="z-10 bg-tg-sidebar px-4 py-3 flex items-center justify-center border-t border-black/5 dark:border-white/5 pb-safe"><div className="flex items-center space-x-2 bg-tg-accent/10 px-4 py-1.5 rounded-full border border-tg-accent/20"><BadgeCheck size={16} className="text-tg-accent" fill="#2AABEE" stroke="white" /><span className="text-tg-accent font-bold text-xs uppercase tracking-wide">Official Channel</span></div></div>
      ) : (
        <InputBar onSend={handleSendMessage} storageUsage={storageUsage} onFileUpload={onFileUpload} onTyping={handleTyping} />
      )}
      {showWallpaperModal && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-[#000000] animate-fadeIn h-[100dvh]">
              <div className="px-4 py-3 pt-safe flex items-center justify-between bg-tg-sidebar border-b border-black/5 dark:border-white/5 z-20">
                  <button onClick={() => setShowWallpaperModal(false)} className="p-2 -ml-2 text-tg-text hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><ArrowLeft size={24} /></button>
                  <span className="text-tg-text font-bold text-lg">Chat Wallpaper</span>
                  <div className="w-10" />
              </div>
              <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0E1621]">
                  <div className={`flex-1 relative transition-all duration-300 ${activeWallpaper || 'bg-[#0E1621]'} overflow-hidden`}>
                      {!activeWallpaper && <div className="absolute inset-0 bg-tg-pattern bg-repeat opacity-[0.03] pointer-events-none" />}
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                      <div className="absolute bottom-6 left-0 right-0 px-4 space-y-3 flex flex-col z-10">
                           <div className="self-center bg-tg-sidebar/60 backdrop-blur-md text-[12px] font-medium px-3 py-1 rounded-full text-white/70 border border-black/5 dark:border-white/5 mb-2 shadow-sm">{t('today')}</div>
                           <div className="self-start bg-tg-bubbleIn text-white px-4 py-2 rounded-2xl rounded-tl-none max-w-[75%] shadow-sm relative animate-fadeIn"><p className="text-[15px]">How does this wallpaper look?</p><span className="text-[11px] text-white/50 block text-right mt-1">10:41</span></div>
                           <div className="self-end bg-tg-bubbleOut text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[75%] shadow-sm relative animate-fadeIn" style={{ animationDelay: '0.1s' }}><p className="text-[15px]">It looks amazing! The colors are perfect. 🎨</p><span className="text-[11px] text-white/70 block text-right mt-1 flex items-center justify-end gap-1">10:42 <CheckCheck size={14} /></span></div>
                      </div>
                  </div>
                  <div className="h-auto bg-tg-sidebar border-t border-black/5 dark:border-white/5 pb-safe flex flex-col">
                      {showApplyOptions ? (
                          <div className="p-4 space-y-3 animate-form-entrance">
                              <h3 className="text-tg-text font-bold text-center mb-4">Set Wallpaper</h3>
                              <button onClick={() => handleApplyWallpaper('me')} className="w-full py-3.5 bg-tg-bubbleIn rounded-xl text-white font-medium hover:brightness-110 flex items-center justify-center space-x-2"><Wallpaper size={18} /><span>Set for Me</span></button>
                              {canSetForBoth && (<button onClick={() => handleApplyWallpaper('both')} className="w-full py-3.5 bg-tg-accent rounded-xl text-white font-bold shadow-lg flex items-center justify-center space-x-2"><CheckCheck size={18} /><span>Set for Me and {liveChatUser.name}</span></button>)}
                              <button onClick={() => setShowApplyOptions(false)} className="w-full py-3 text-tg-secondary text-sm font-medium hover:text-tg-text mt-2">Cancel</button>
                          </div>
                      ) : (
                          <div className="p-4">
                              <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                                  <div onClick={() => bgInputRef.current?.click()} className="flex-shrink-0 w-[100px] aspect-[9/16] rounded-xl bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors group relative overflow-hidden">
                                      {isUploadingBg ? (<Loader2 className="animate-spin text-tg-accent" />) : (<><div className="w-10 h-10 rounded-full bg-tg-accent/10 flex items-center justify-center mb-2 group-hover:bg-tg-accent/20 transition-colors"><ImagePlus className="text-tg-accent" size={20} /></div><span className="text-[11px] text-tg-accent font-medium">Upload</span></>)}
                                      <input type="file" ref={bgInputRef} onChange={handleUploadWallpaper} className="hidden" accept="image/*" />
                                  </div>
                                  {WALLPAPERS.map((wp) => (
                                      <div key={wp.id} onClick={() => setTempWallpaper(wp.bg)} className={`flex-shrink-0 w-[100px] relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeWallpaper === wp.bg ? 'border-tg-accent scale-[0.98]' : 'border-transparent hover:scale-[1.02]'}`}>
                                          <div className={`w-full h-full ${wp.bg || 'bg-[#0E1621]'}`}>{wp.id === 'wp_default' && <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30 font-medium">Default</div>}</div>
                                          {activeWallpaper === wp.bg && (<div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="bg-tg-accent rounded-full p-1 shadow-sm"><Check size={14} className="text-white" strokeWidth={3} /></div></div>)}
                                      </div>
                                  ))}
                              </div>
                              <button onClick={() => setShowApplyOptions(true)} className="w-full mt-4 py-3.5 bg-tg-accent rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform">Set Wallpaper</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      {viewingGiftMessage && viewingGiftMessage.giftData && (
          <div className="fixed inset-0 z-[110] flex flex-col bg-black/90 animate-fadeIn justify-center items-center p-4">
              <div className="bg-tg-sidebar w-full max-w-sm rounded-2xl border border-white/5 relative shadow-2xl animate-form-entrance overflow-hidden">
                  <div className="relative h-48 flex items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#1c242f]">
                      <div className="absolute inset-0 opacity-30" style={{ backgroundColor: viewingGiftMessage.giftData.backgroundColor }} />
                      <div className="w-32 h-32 relative z-10 animate-plane-float filter drop-shadow-2xl"><img src={viewingGiftMessage.giftData.imageUrl} alt="Gift" className="w-full h-full object-contain" /></div>
                      <button onClick={() => setViewingGiftMessage(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors z-20"><X size={20} /></button>
                  </div>
                  <div className="p-6">
                      <h2 className="text-tg-text font-bold text-2xl text-center mb-1">{viewingGiftMessage.giftData.name}</h2>
                      {viewingGiftMessage.giftData.comment && (<p className="text-tg-secondary text-sm text-center italic mb-6">"{viewingGiftMessage.giftData.comment}"</p>)}
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-tg-accent/20 flex items-center justify-center text-tg-accent"><UserIcon size={20} /></div><div><p className="text-xs text-tg-secondary uppercase font-bold">From</p><p className="text-tg-text font-medium">{viewingGiftMessage.senderId === currentUser.id ? currentUser.name : (viewingGiftMessage.giftData.isAnonymous ? "Anonymous" : viewingGiftMessage.giftData.fromUserName || "Unknown User")}</p></div></div></div>
                          <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center"><Calendar size={20} /></div><div><p className="text-xs text-tg-secondary uppercase font-bold">Date</p><p className="text-tg-text font-medium">{viewingGiftMessage.timestampRaw ? new Date(viewingGiftMessage.timestampRaw).toLocaleDateString() + ' at ' + new Date(viewingGiftMessage.timestampRaw).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : viewingGiftMessage.timestamp}</p></div></div></div>
                          <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center"><Zap size={20} className="fill-current" /></div><div><p className="text-xs text-tg-secondary uppercase font-bold">Value</p><p className="text-tg-text font-medium">{viewingGiftMessage.giftData.price} Zippers</p></div></div></div>
                      </div>
                      <button onClick={() => setViewingGiftMessage(null)} className="w-full mt-6 py-3 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-tg-text font-bold rounded-xl transition-colors">Close</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatScreen;
