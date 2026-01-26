
export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  avatarColor: string;
  status: 'online' | 'offline' | 'typing';
  lastSeen?: string | number; 
  lastSeenPrivacy?: 'everybody' | 'nobody'; // New Privacy Setting
  username?: string;
  bio?: string;
  avatarUrl?: string;
  isVideoAvatar?: boolean;
  isBanned?: boolean;
  isOfficial?: boolean;
  isAdmin?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'voice' | 'image' | 'video' | 'file' | 'audio';
  duration?: string;
  audioUrl?: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  interactiveEmoji?: {
    type: 'dice' | 'basketball' | 'dart';
    value: number;
  };
  scheduledTimestamp?: number;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
  type: 'private' | 'group' | 'channel';
  isReadOnly?: boolean;
}

export interface StorageStats {
  media: number;
  files: number;
  voice: number;
  total: number;
}

export enum AppScreen {
  AUTH = 'AUTH',
  MAIN = 'MAIN',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  USER_INFO = 'USER_INFO',
  FEATURES = 'FEATURES',
  PRIVACY = 'PRIVACY',
  FAQ = 'FAQ',
  NOTIFICATIONS = 'NOTIFICATIONS',
  GUIDE = 'GUIDE',
  DATA_STORAGE = 'DATA_STORAGE',
  ADMIN = 'ADMIN'
}

export type Language = 'ru' | 'en' | 'es' | 'de' | 'fr' | 'tr' | 'it';

// Helper function to check if a user is truly online based on heartbeat
// Added viewer parameter for Reciprocity Rule
export const isUserOnline = (user: User, viewer?: User): boolean => {
  // Official bots are always online
  if (user.id === 'news-bot' || user.id === 'housegram_news') return true;

  // 1. Target Privacy: If they hide it, they are offline to us
  if (user.lastSeenPrivacy === 'nobody') return false;

  // 2. Viewer Privacy (Reciprocity): If I hide my status, I can't see yours
  if (viewer && viewer.lastSeenPrivacy === 'nobody') return false;

  // Strict check: Must have a numeric timestamp within the last 2 minutes (120000ms)
  if (typeof user.lastSeen === 'number') {
    const now = Date.now();
    const diff = now - user.lastSeen;
    return diff < 120000; 
  }
  
  return false;
};

// Helper to format last seen text
export const formatLastSeen = (user: User, t: (k: string) => string, viewer?: User): string => {
  // 1. If strictly online (and allowed by privacy), show Online
  if (isUserOnline(user, viewer)) return t('online');
  
  // 2. Privacy Checks (Target Hides OR Viewer Hides/Reciprocity)
  if (user.lastSeenPrivacy === 'nobody' || (viewer && viewer.lastSeenPrivacy === 'nobody')) {
      return t('lastSeenRecently');
  }

  // 3. Show exact time if privacy allows
  if (typeof user.lastSeen === 'number') {
    const date = new Date(user.lastSeen);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `${t('lastSeenAt')} ${timeStr}`;
    return `${t('lastSeenAt')} ${date.toLocaleDateString()} ${timeStr}`;
  }
  
  // Fallback for legacy string data
  return user.lastSeen && user.lastSeen !== 'now' ? `${t('lastSeenAt')} ${user.lastSeen}` : t('offline');
};
