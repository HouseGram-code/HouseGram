
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Ban, BadgeCheck, ShieldCheck, Bookmark, MoreVertical, Wallpaper, Check, CheckCheck, Loader2, ImagePlus, Gift, Zap, X, User as UserIcon, Calendar, Clock } from 'lucide-react';
import { Chat, Message, User, formatLastSeen, Gift as GiftType } from '../types.ts';
import MessageBubble from './MessageBubble.tsx';
import VoiceMessage from './VoiceMessage.tsx';
import InputBar from './InputBar.tsx';
import { useLanguage } from '../LanguageContext.tsx';
import { db, storage } from '../firebase.ts';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ChatScreenProps {
  chat: Chat;
  currentUser: User;
  isBlocked: boolean;
  onBack: () => void;
  onOpenUserInfo: (user: User) => void;
  storageUsage: number;
  onFileUpload: (size: number, category: 'media' | 'files' | 'voice') => void;
}

// Available Gifts Config - Modified to only show Teddy Bear
const AVAILABLE_GIFTS: GiftType[] = [
    { id: 'g_bear', name: 'Teddy Bear', price: 15, imageUrl: 'https://cdn-icons-png.flaticon.com/512/4255/4255288.png', backgroundColor: '#3F2E23' }
];

const ChatScreen: React.FC<ChatScreenProps> = ({ 
    chat, currentUser, isBlocked, onBack, onOpenUserInfo, storageUsage, onFileUpload 
}) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [liveChatUser, setLiveChatUser] = useState<User>(chat.user);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  
  // UI State for Menu & Wallpaper
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const [giftComment, setGiftComment] = useState('');
  const [isAnonymousGift, setIsAnonymousGift] = useState(false);
  
  // Gift Viewing State
  const [viewingGiftMessage, setViewingGiftMessage] = useState<Message | null>(null);

  const [currentWallpaper, setCurrentWallpaper] = useState<string>('');
  const [tempWallpaper, setTempWallpaper] = useState<string | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [showApplyOptions, setShowApplyOptions] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const isSavedMessages = chat.id === `saved_${currentUser.id}`;

  const WALLPAPERS = [
      { id: 'wp_default', bg: '', name: 'Default' },
      { id: 'wp_1', bg: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900', name: 'Nebula' },
      { id: 'wp_2', bg: 'bg-[url("https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop")] bg-cover bg-center', name: 'Waves' },
      { id: 'wp_3', bg: 'bg-[url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop")] bg-cover bg-center', name: 'Forest' },
      { id: 'wp_4', bg: 'bg-[url("https://images.unsplash.com/photo-1506318137071-a8bcbf67cc77?q=80&w=2600&auto=format&fit=crop")] bg-cover bg-center', name: 'Dark City' },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Subscribe to Live User Data (for Status/Heartbeat)
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

  // Subscribe to Chat Doc (for Wallpaper AND Typing Status) and Messages
  useEffect(() => {
    if (!chat.id || chat.id === 'news-placeholder') return;
    
    // 1. Listen to Chat Metadata (Wallpaper, Typing)
    const unsubChat = onSnapshot(doc(db, "chats", chat.id), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const localWP = localStorage.getItem(`wallpaper_${chat.id}`);
            setCurrentWallpaper(localWP || data.wallpaper || '');
            if (!showWallpaperModal) {
                 setTempWallpaper(localWP || data.wallpaper || '');
            }

            // Check Typing Status
            if (data.typing && !isSavedMessages) {
                const partnerTypingTime = data.typing[chat.user.id];
                if (partnerTypingTime && Date.now() - partnerTypingTime < 4000) {
                    setIsPartnerTyping(true);
                } else {
                    setIsPartnerTyping(false);
                }
            } else {
                setIsPartnerTyping(false);
            }
        }
    });

    // 2. Listen to Messages
    const msgsRef = collection(db, "chats", chat.id, "messages");
    const q = query(msgsRef, orderBy("timestampRaw", "asc"));

    const unsubMsgs = onSnapshot(q, (snapshot) => {
        const loadedMsgs = snapshot.docs.map(d => ({
            ...d.data(),
            id: d.id
        })) as Message[];
        setMessages(loadedMsgs);
        
        // Auto scroll to bottom
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);

        // MARK AS READ LOGIC
        const unreadIds: string[] = [];
        snapshot.docs.forEach(d => {
            const msg = d.data();
            if (msg.senderId !== currentUser.id && !msg.isRead) {
                unreadIds.push(d.id);
            }
        });

        if (unreadIds.length > 0) {
            const batch = writeBatch(db);
            unreadIds.forEach(id => {
                const docRef = doc(db, "chats", chat.id, "messages", id);
                batch.update(docRef, { isRead: true });
            });
            batch.commit().catch(console.error);
        }
    });

    return () => {
        unsubChat();
        unsubMsgs();
    };
  }, [chat.id, chat.user.id, currentUser.id, isSavedMessages]);

  const handleSendMessage = async (text: string, type: Message['type'], mediaUrl?: string, meta?: string, scheduledTime?: number) => {
    if (isBlocked || chat.isReadOnly || sending) return;
    
    let interactiveEmoji: Message['interactiveEmoji'] | undefined;
    const cleanText = text ? text.trim() : '';

    if (type === 'text') {
        if (cleanText === '🎲') {
            interactiveEmoji = { type: 'dice', value: Math.floor(Math.random() * 6) + 1 };
        } else if (cleanText === '🏀') {
            interactiveEmoji = { type: 'basketball', value: Math.floor(Math.random() * 5) + 1 }; 
        } else if (cleanText === '🎯') {
            interactiveEmoji = { type: 'dart', value: Math.floor(Math.random() * 6) + 1 }; 
        }
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
        if (!scheduledTime) {
            await updateDoc(doc(db, "chats", chat.id), {
                lastMessage: newMessageData,
                updatedAt: Date.now()
            });
        }
    } catch (e) {
        console.error("Error sending message", e);
    }
  };

  const handleGiftClick = (gift: GiftType) => {
      setSelectedGift(gift);
      setGiftComment('');
      setIsAnonymousGift(false);
  };

  const confirmSendGift = async () => {
      if (!selectedGift || !currentUser?.id) return;
      
      // Balance Check
      const userBalance = currentUser.zippers || 0;
      if (userBalance < selectedGift.price) {
          alert(`Not enough Zippers! You have ${userBalance} but need ${selectedGift.price}.`);
          return;
      }

      // Capture values locally to avoid closure staleness issues
      const giftToProcess = selectedGift;
      const commentToProcess = giftComment;
      const isAnon = isAnonymousGift;
      const tsRaw = Date.now();

      const finalGiftData: GiftType = {
          id: giftToProcess.id,
          name: giftToProcess.name,
          price: giftToProcess.price,
          imageUrl: giftToProcess.imageUrl,
          backgroundColor: giftToProcess.backgroundColor,
          comment: commentToProcess || '',
          isAnonymous: isAnon,
          fromUserId: currentUser.id,
          fromUserName: currentUser.name || 'Unknown',
          timestamp: tsRaw
      };

      // Close modal immediately to improve perceived speed
      setShowGiftModal(false);
      setSelectedGift(null);
      setGiftComment('');
      
      const newMessageData = {
          senderId: currentUser.id,
          timestamp: new Date(tsRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestampRaw: tsRaw,
          isRead: false,
          type: 'gift' as Message['type'],
          giftData: finalGiftData
      };

      try {
          // 1. Deduct Balance (Optimistic approach but secured by check above)
          const senderRef = doc(db, "users", currentUser.id);
          await updateDoc(senderRef, {
              zippers: userBalance - selectedGift.price
          });

          // 2. Send Message
          await addDoc(collection(db, "chats", chat.id, "messages"), newMessageData);
          
          // Update Chat Last Message
          await updateDoc(doc(db, "chats", chat.id), {
              lastMessage: { ...newMessageData, text: `🎁 Gift: ${giftToProcess.name}` },
              updatedAt: Date.now()
          });

          // 3. Add to Recipient's Profile
          if (!isSavedMessages) {
              const recipientRef = doc(db, "users", chat.user.id);
              await updateDoc(recipientRef, {
                  gifts: arrayUnion(finalGiftData)
              });
          }
      } catch (e) {
          console.error("Error sending gift", e);
      }
  };

  const handleTyping = async () => {
     if (isSavedMessages || chat.isReadOnly) return;
     try {
         const chatRef = doc(db, "chats", chat.id);
         await updateDoc(chatRef, {
             [`typing.${currentUser.id}`]: Date.now()
         });
     } catch (e) {
         // Ignore offline typing errors
     }
  };

  const handleUploadWallpaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBg(true);
    try {
        const filename = `wallpapers/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        const bgClass = `bg-[url('${url}')] bg-cover bg-center`;
        setTempWallpaper(bgClass);
    } catch (e) {
        console.error("Wallpaper upload error", e);
        alert("Failed to upload wallpaper");
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

  const getStatusText = () => {
      if (isPartnerTyping) return 'typing';
      if (isSavedMessages) return t('cloudStorage');
      if (chat.isReadOnly) return 'service notifications';
      return formatLastSeen(liveChatUser, t, currentUser);
  };
  
  const getSenderName = (msg: Message) => {
      if (msg.giftData?.isAnonymous) return "Anonymous";
      if (msg.senderId === currentUser.id) return currentUser.name;
      if (msg.senderId === chat.user.id) return chat.user.name;
      return "Unknown User";
  };

  const statusText = getStatusText();
  const isOnline = statusText === t('online');
  const activeWallpaper = tempWallpaper !== null ? tempWallpaper : currentWallpaper;

  return (
    <div className={`flex flex-col w-full bg-tg-bg relative overflow-hidden h-full ${currentWallpaper}`}>
       {!currentWallpaper && <div className="absolute inset-0 bg-tg-pattern bg-repeat opacity-[0.03] pointer-events-none" />}

      {/* Header */}
      <div className="z-10 bg-tg-sidebar px-2 pb-2 pt-safe flex items-center justify-between border-b border-tg-border/50 shadow-md min-h-[60px] h-auto shrink-0 relative">
        <div className="flex items-center flex-1 overflow-hidden mr-2">
          <button onClick={onBack} className="p-3 mr-1 text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0 active:scale-95">
            <ArrowLeft size={22} />
          </button>
          
          <div 
            onClick={() => onOpenUserInfo(liveChatUser)} 
            className="flex items-center flex-1 cursor-pointer overflow-hidden group py-1 active:opacity-70 transition-opacity"
          >
            {isSavedMessages ? (
                 <div className="w-10 h-10 rounded-full flex-shrink-0 bg-tg-accent flex items-center justify-center font-bold text-white shadow-sm border border-white/5 relative overflow-hidden mr-3">
                     <Bookmark size={20} className="text-white" fill="white" />
                 </div>
            ) : (
                <div className={`w-10 h-10 rounded-full flex-shrink-0 ${liveChatUser.avatarColor} flex items-center justify-center font-bold text-white shadow-sm border border-white/5 relative overflow-hidden mr-3`}>
                {liveChatUser.avatarUrl ? (
                    liveChatUser.isVideoAvatar ? (
                        <video src={liveChatUser.avatarUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                        <img src={liveChatUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                    )
                ) : (
                    liveChatUser.name.charAt(0)
                )}
                </div>
            )}

            <div className="flex flex-col overflow-hidden justify-center">
              <span className="text-white font-bold text-[16px] leading-tight truncate flex items-center">
                {isSavedMessages ? t('saved') : liveChatUser.name}
                {isSavedMessages ? null : (
                    <>
                        {liveChatUser.isAdmin ? (
                        <ShieldCheck size={14} className="ml-1 text-amber-500 shrink-0" fill="currentColor" stroke="black" strokeWidth={1} />
                        ) : chat.isReadOnly || liveChatUser.isOfficial ? (
                        <BadgeCheck size={14} className="ml-1 text-tg-accent shrink-0" fill="#2AABEE" stroke="white" />
                        ) : null}
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
              ) : (
                 <span className={`text-[13px] truncate leading-tight ${isOnline && !isSavedMessages ? 'text-tg-online' : 'text-tg-secondary'}`}>
                    {statusText}
                 </span>
              )}

            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className={`p-2 text-tg-secondary hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95 ${isMenuOpen ? 'bg-white/5 text-white' : ''}`}
            >
                <MoreVertical size={22} />
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#1c242f] border border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn origin-top-right">
                    <button 
                        onClick={() => { setShowWallpaperModal(true); setIsMenuOpen(false); setTempWallpaper(currentWallpaper); }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/5 flex items-center space-x-3 transition-colors"
                    >
                        <Wallpaper size={18} className="text-tg-accent" />
                        <span>Change Wallpaper</span>
                    </button>
                    {!isSavedMessages && (
                        <button 
                            onClick={() => { setShowGiftModal(true); setIsMenuOpen(false); }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/5 flex items-center space-x-3 transition-colors"
                        >
                            <Gift size={18} className="text-purple-400" />
                            <span>Send Gift</span>
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 relative z-0 flex flex-col pb-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 space-y-4 select-none pb-12">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              {isSavedMessages ? <Bookmark size={48} className="text-white" /> : <MessageCircle size={48} className="text-white" />}
            </div>
            <div className="text-center px-4">
              <p className="text-white font-bold text-lg mb-1">{isSavedMessages ? t('saved') : t('noMessages')}</p>
              <p className="text-sm text-tg-secondary">{isSavedMessages ? 'Store messages, media, and files here.' : t('noMessagesSub')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="self-center bg-tg-sidebar/60 backdrop-blur-md text-[12px] font-medium px-3 py-1 rounded-full text-white/70 border border-white/5 my-2 shadow-sm">
              {t('today')}
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} animate-fadeIn w-full`}>
                {(msg.type === 'voice' || msg.type === 'audio') ? (
                  <VoiceMessage message={msg} isOutgoing={msg.senderId === currentUser.id} />
                ) : (
                  <MessageBubble 
                    message={msg} 
                    isOutgoing={msg.senderId === currentUser.id} 
                    onViewGift={(m) => setViewingGiftMessage(m)}
                  />
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {isBlocked ? (
        <div className="z-10 bg-tg-sidebar px-4 py-4 flex items-center justify-center space-x-2 border-t border-tg-border/50 text-red-400 font-medium pb-safe">
          <Ban size={18} />
          <span>{t('userBlockedMsg')}</span>
        </div>
      ) : chat.isReadOnly ? (
        <div className="z-10 bg-tg-sidebar px-4 py-3 flex items-center justify-center border-t border-tg-border/50 pb-safe">
             <div className="flex items-center space-x-2 bg-tg-accent/10 px-4 py-1.5 rounded-full border border-tg-accent/20">
                <BadgeCheck size={16} className="text-tg-accent" fill="#2AABEE" stroke="white" />
                <span className="text-tg-accent font-bold text-xs uppercase tracking-wide">Official Channel</span>
             </div>
        </div>
      ) : (
        <InputBar 
          onSend={handleSendMessage} 
          storageUsage={storageUsage}
          onFileUpload={onFileUpload}
          onTyping={handleTyping}
          onGiftClick={() => {
              if (!isSavedMessages) setShowGiftModal(true);
          }}
        />
      )}

      {/* Wallpaper Preview Modal */}
      {showWallpaperModal && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-[#000000] animate-fadeIn h-[100dvh]">
              {/* Wallpaper Header */}
              <div className="px-4 py-3 pt-safe flex items-center justify-between bg-tg-sidebar border-b border-tg-border z-20">
                  <button onClick={() => setShowWallpaperModal(false)} className="p-2 -ml-2 text-white hover:bg-white/5 rounded-full">
                      <ArrowLeft size={24} />
                  </button>
                  <span className="text-white font-bold text-lg">Chat Wallpaper</span>
                  <div className="w-10" />
              </div>

              {/* Wallpaper Content */}
              <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0E1621]">
                  
                  {/* PREVIEW AREA */}
                  <div className={`flex-1 relative transition-all duration-300 ${activeWallpaper || 'bg-[#0E1621]'} overflow-hidden`}>
                      {!activeWallpaper && <div className="absolute inset-0 bg-tg-pattern bg-repeat opacity-[0.03] pointer-events-none" />}
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" /> {/* Subtle dim for readability */}
                      
                      <div className="absolute bottom-6 left-0 right-0 px-4 space-y-3 flex flex-col z-10">
                           <div className="self-center bg-tg-sidebar/60 backdrop-blur-md text-[12px] font-medium px-3 py-1 rounded-full text-white/70 border border-white/5 mb-2 shadow-sm">
                              {t('today')}
                           </div>
                           
                           <div className="self-start bg-tg-bubbleIn text-white px-4 py-2 rounded-2xl rounded-tl-none max-w-[75%] shadow-sm relative animate-fadeIn">
                               <p className="text-[15px]">How does this wallpaper look?</p>
                               <span className="text-[11px] text-white/50 block text-right mt-1">10:41</span>
                           </div>

                           <div className="self-end bg-tg-bubbleOut text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[75%] shadow-sm relative animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                               <p className="text-[15px]">It looks amazing! The colors are perfect. 🎨</p>
                               <span className="text-[11px] text-white/70 block text-right mt-1 flex items-center justify-end gap-1">
                                   10:42 <CheckCheck size={14} />
                               </span>
                           </div>
                      </div>
                  </div>

                  {/* SELECTION AREA */}
                  <div className="h-auto bg-tg-sidebar border-t border-tg-border pb-safe flex flex-col">
                      {showApplyOptions ? (
                          <div className="p-4 space-y-3 animate-form-entrance">
                              <h3 className="text-white font-bold text-center mb-4">Set Wallpaper</h3>
                              <button 
                                onClick={() => handleApplyWallpaper('me')}
                                className="w-full py-3.5 bg-tg-bubbleIn rounded-xl text-white font-medium hover:bg-white/5 flex items-center justify-center space-x-2"
                              >
                                  <Wallpaper size={18} />
                                  <span>Set for Me</span>
                              </button>
                              <button 
                                onClick={() => handleApplyWallpaper('both')}
                                className="w-full py-3.5 bg-tg-accent rounded-xl text-white font-bold shadow-lg flex items-center justify-center space-x-2"
                              >
                                  <CheckCheck size={18} />
                                  <span>Set for Me and {isSavedMessages ? 'Saved' : liveChatUser.name}</span>
                              </button>
                              <button 
                                onClick={() => setShowApplyOptions(false)}
                                className="w-full py-3 text-tg-secondary text-sm font-medium hover:text-white mt-2"
                              >
                                  Cancel
                              </button>
                          </div>
                      ) : (
                          <div className="p-4">
                              <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                                  {/* Upload Button */}
                                  <div 
                                    onClick={() => bgInputRef.current?.click()}
                                    className="flex-shrink-0 w-[100px] aspect-[9/16] rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors group relative overflow-hidden"
                                  >
                                      {isUploadingBg ? (
                                        <Loader2 className="animate-spin text-tg-accent" />
                                      ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-tg-accent/10 flex items-center justify-center mb-2 group-hover:bg-tg-accent/20 transition-colors">
                                                <ImagePlus className="text-tg-accent" size={20} />
                                            </div>
                                            <span className="text-[11px] text-tg-accent font-medium">Upload</span>
                                        </>
                                      )}
                                      <input type="file" ref={bgInputRef} onChange={handleUploadWallpaper} className="hidden" accept="image/*" />
                                  </div>

                                  {/* Presets - Horizontal List */}
                                  {WALLPAPERS.map((wp) => (
                                      <div 
                                        key={wp.id}
                                        onClick={() => setTempWallpaper(wp.bg)}
                                        className={`flex-shrink-0 w-[100px] relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeWallpaper === wp.bg ? 'border-tg-accent scale-[0.98]' : 'border-transparent hover:scale-[1.02]'}`}
                                      >
                                          <div className={`w-full h-full ${wp.bg || 'bg-[#0E1621]'}`}>
                                              {wp.id === 'wp_default' && <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30 font-medium">Default</div>}
                                          </div>
                                          {activeWallpaper === wp.bg && (
                                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                  <div className="bg-tg-accent rounded-full p-1 shadow-sm">
                                                      <Check size={14} className="text-white" strokeWidth={3} />
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>

                              <button 
                                onClick={() => setShowApplyOptions(true)}
                                className="w-full mt-4 py-3.5 bg-tg-accent rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform"
                              >
                                  Set Wallpaper
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* GIFT SELECTION MODAL */}
      {showGiftModal && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 animate-fadeIn justify-end">
              <div className="bg-[#1c242f] rounded-t-3xl border-t border-white/10 flex flex-col h-[70vh] shadow-2xl animate-form-entrance relative">
                  
                  {selectedGift ? (
                      // GIFT SENDING CONFIRMATION SCREEN
                      <div className="flex-1 flex flex-col p-6 animate-fadeIn">
                          <button 
                            onClick={() => setSelectedGift(null)} 
                            className="absolute top-4 left-4 p-2 text-white hover:bg-white/10 rounded-full"
                          >
                              <ArrowLeft size={24} />
                          </button>

                          <div className="flex-1 flex flex-col items-center justify-center mb-6">
                              <div className="w-40 h-40 relative mb-4 animate-plane-float">
                                  <div className="absolute inset-0 rounded-full opacity-30 blur-2xl" style={{ backgroundColor: selectedGift.backgroundColor }} />
                                  <img src={selectedGift.imageUrl} alt={selectedGift.name} className="w-full h-full object-contain relative z-10" />
                              </div>
                              <h2 className="text-white font-bold text-2xl mb-1 text-center">{t('message') ? 'Send Gift' : 'Send Gift'}</h2>
                              <p className="text-tg-secondary text-sm text-center max-w-xs">
                                  Use Zippers to purchase and send this unique gift.
                              </p>
                              <div className="mt-2 text-white/50 text-xs font-bold uppercase tracking-wider">
                                  Balance: {currentUser?.zippers || 0} Zippers
                              </div>
                          </div>

                          <div className="space-y-4 mb-6">
                              <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                                  <input 
                                    type="text" 
                                    placeholder="Add a comment..."
                                    value={giftComment}
                                    onChange={(e) => setGiftComment(e.target.value)}
                                    className="w-full bg-transparent text-white placeholder-white/30 focus:outline-none"
                                  />
                              </div>
                              
                              <div className="flex items-center justify-between px-2">
                                  <span className="text-white font-medium">Hide my name</span>
                                  <button 
                                    onClick={() => setIsAnonymousGift(!isAnonymousGift)}
                                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 relative ${isAnonymousGift ? 'bg-tg-accent' : 'bg-[#3A3A3C]'}`}
                                  >
                                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${isAnonymousGift ? 'translate-x-5' : 'translate-x-0'}`} />
                                  </button>
                              </div>
                          </div>

                          <button 
                            onClick={confirmSendGift}
                            className="w-full py-4 bg-tg-accent rounded-xl text-white font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                              <span>Send Gift for {selectedGift.price}</span>
                              <Zap size={18} className="fill-white" />
                          </button>
                      </div>
                  ) : (
                      // GIFT GRID SELECTOR
                      <>
                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <Gift className="text-purple-400" /> Send Gift
                            </h3>
                            <button onClick={() => setShowGiftModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
                            {AVAILABLE_GIFTS.map((gift) => (
                                <div 
                                    key={gift.id} 
                                    onClick={() => handleGiftClick(gift)}
                                    className="bg-[#242f3d] rounded-2xl p-4 flex flex-col items-center justify-between relative overflow-hidden group cursor-pointer hover:bg-[#2b3849] transition-all border border-transparent hover:border-purple-500/30"
                                >
                                    {/* Background Glow */}
                                    <div className="absolute inset-0 opacity-20 transition-opacity" style={{ backgroundColor: gift.backgroundColor }} />
                                    
                                    <div className="relative z-10 w-20 h-20 mb-3 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                                        <img src={gift.imageUrl} alt={gift.name} className="w-full h-full object-contain" />
                                    </div>
                                    
                                    <div className="relative z-10 text-center w-full">
                                        <p className="text-white font-bold text-sm mb-1">{gift.name}</p>
                                        <div className="bg-white/10 rounded-full px-3 py-1 inline-flex items-center space-x-1">
                                            <span className="text-amber-400 font-bold text-xs">{gift.price}</span>
                                            <Zap size={10} className="text-amber-400 fill-amber-400" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}

      {/* VIEW GIFT DETAILS MODAL */}
      {viewingGiftMessage && viewingGiftMessage.giftData && (
          <div className="fixed inset-0 z-[110] flex flex-col bg-black/90 animate-fadeIn justify-center items-center p-4">
              <div className="bg-[#1c242f] w-full max-w-sm rounded-2xl border border-white/10 relative shadow-2xl animate-form-entrance overflow-hidden">
                  <div className="relative h-48 flex items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#1c242f]">
                      <div className="absolute inset-0 opacity-30" style={{ backgroundColor: viewingGiftMessage.giftData.backgroundColor }} />
                      <div className="w-32 h-32 relative z-10 animate-plane-float filter drop-shadow-2xl">
                          <img src={viewingGiftMessage.giftData.imageUrl} alt="Gift" className="w-full h-full object-contain" />
                      </div>
                      <button onClick={() => setViewingGiftMessage(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors z-20">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-6">
                      <h2 className="text-white font-bold text-2xl text-center mb-1">{viewingGiftMessage.giftData.name}</h2>
                      {viewingGiftMessage.giftData.comment && (
                          <p className="text-tg-secondary text-sm text-center italic mb-6">"{viewingGiftMessage.giftData.comment}"</p>
                      )}
                      
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                              <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-tg-accent/20 flex items-center justify-center text-tg-accent">
                                      <UserIcon size={20} />
                                  </div>
                                  <div>
                                      <p className="text-xs text-tg-secondary uppercase font-bold">From</p>
                                      <p className="text-white font-medium">{getSenderName(viewingGiftMessage)}</p>
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                              <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                      <Calendar size={20} />
                                  </div>
                                  <div>
                                      <p className="text-xs text-tg-secondary uppercase font-bold">Date</p>
                                      <p className="text-white font-medium">
                                          {viewingGiftMessage.timestampRaw 
                                            ? new Date(viewingGiftMessage.timestampRaw).toLocaleDateString() + ' at ' + new Date(viewingGiftMessage.timestampRaw).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                            : viewingGiftMessage.timestamp
                                          }
                                      </p>
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                              <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                      <Zap size={20} className="fill-current" />
                                  </div>
                                  <div>
                                      <p className="text-xs text-tg-secondary uppercase font-bold">Value</p>
                                      <p className="text-white font-medium">{viewingGiftMessage.giftData.price} Zippers</p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <button 
                        onClick={() => setViewingGiftMessage(null)}
                        className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatScreen;
