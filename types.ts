
export interface User {
  id: string;
  name: string;
  email?: string; // Changed from phone to optional email or keep phone as optional
  phone: string;
  avatarColor: string;
  status: 'online' | 'offline' | 'typing';
  lastSeen?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  isVideoAvatar?: boolean;
  isBanned?: boolean; // System ban status
  isOfficial?: boolean; // Official Developer/Admin status - Exclusive to Admin
  isAdmin?: boolean; // Super Admin status for specific email
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