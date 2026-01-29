
export interface Gift {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  backgroundColor?: string;
  comment?: string;
  isAnonymous?: boolean;
  fromUserId?: string;
  fromUserName?: string;
  timestamp?: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  avatarColor: string;
  status: 'online' | 'offline' | 'typing';
  lastSeen?: string | number; 
  lastSeenPrivacy?: 'everybody' | 'nobody'; 
  username?: string;
  bio?: string;
  avatarUrl?: string;
  isVideoAvatar?: boolean;
  isBanned?: boolean;
  isOfficial?: boolean;
  isAdmin?: boolean;
  isTester?: boolean; 
  isPremium?: boolean; 
  gifts?: Gift[]; 
  zippers?: number; 
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'voice' | 'image' | 'video' | 'file' | 'audio' | 'gift' | 'sticker';
  duration?: string;
  audioUrl?: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  interactiveEmoji?: {
    type: 'dice' | 'basketball' | 'dart';
    value: number;
  };
  giftData?: Gift;
  scheduledTimestamp?: number;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
  type: 'private' | 'group' | 'channel';
  isReadOnly?: boolean;
  typing?: Record<string, number>; 
  wallpaper?: string;
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

export const isUserOnline = (user: User, viewer?: User): boolean => {
  if (user.lastSeenPrivacy === 'nobody' && (!viewer || !viewer.isPremium)) return false;
  if (typeof user.lastSeen === 'number') {
    const now = Date.now();
    return now - user.lastSeen < 120000; 
  }
  return false;
};

export const formatLastSeen = (user: User, t: (k: string) => string, viewer?: User): string => {
  if (isUserOnline(user, viewer)) return t('online');
  if (user.lastSeenPrivacy === 'nobody' && (!viewer || !viewer.isPremium)) return t('lastSeenRecently');
  if (typeof user.lastSeen === 'number') {
    const date = new Date(user.lastSeen);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `${t('lastSeenAt')} ${timeStr}`;
    return `${t('lastSeenAt')} ${date.toLocaleDateString()} ${timeStr}`;
  }
  return t('offline');
};
