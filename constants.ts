
import { Chat, User, Message } from './types.ts';

export const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttaHF6cGZuYmxja2Zyc25iZm5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzYwNDksImV4cCI6MjA4NDY1MjA0OX0.jEfBQYevsutEKN2v6hm4Hk4vZX27mVeBIk2Gde_5jVA';
export const API_URL = 'https://goh-phi.vercel.app/api/goh/pool';
export const MAX_STORAGE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB

export const ME: User = {
  id: 'me',
  name: 'User',
  email: 'user@housegram.app',
  phone: '+1 234 567 8900',
  username: '@user',
  avatarColor: 'bg-tg-accent',
  status: 'online',
};

export const NEWS_BOT_USER: User = {
  id: 'news-bot',
  name: 'HouseGram News',
  username: 'housegram_news',
  phone: 'Service Notification',
  email: 'news@housegram.app',
  avatarColor: 'bg-gradient-to-br from-orange-400 to-red-500',
  status: 'online',
  bio: 'Official source for HouseGram updates, patch notes, and announcements.',
  avatarUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop',
  isOfficial: true // Hardcoded for constant
};

const TEST_BOT_USER: User = {
  id: 'bot-user-1',
  name: 'HouseGram Bot',
  username: 'housegram_bot',
  phone: 'Bot',
  email: 'bot@housegram.app',
  avatarColor: 'bg-indigo-600',
  status: 'online',
  bio: 'Official test bot for HouseGram',
  // isOfficial removed - Exclusive to Admin
};

export const MOCK_CHATS: Chat[] = [
  {
    id: 'chat-news',
    user: NEWS_BOT_USER,
    lastMessage: {
      id: 'update-v0012',
      senderId: 'news-bot',
      timestamp: '14:30',
      isRead: false,
      type: 'text',
      text: '🚀 Update v0.0.1.2: Fixed Upload Skidding'
    },
    unreadCount: 1,
    type: 'channel',
    isReadOnly: true
  },
  {
    id: 'bot-housegram',
    user: TEST_BOT_USER,
    lastMessage: {
      id: 'b1',
      senderId: 'bot-user-1',
      timestamp: '12:00',
      isRead: true,
      type: 'text',
      text: 'Hello! I am your HouseGram assistant.'
    },
    unreadCount: 0,
    type: 'private'
  }
];

export const MOCK_MESSAGES: Message[] = [
  // Test Bot Messages
  {
    id: '1',
    senderId: 'bot-user-1',
    text: 'Hello! I am your HouseGram assistant.',
    timestamp: '12:00',
    isRead: true,
    type: 'text'
  },
  // News Bot Messages
  {
    id: 'n1',
    senderId: 'news-bot',
    timestamp: '14:28',
    isRead: true,
    type: 'text',
    text: '👋 **Welcome to HouseGram News!**'
  },
  {
    id: 'n2',
    senderId: 'news-bot',
    timestamp: '14:29',
    isRead: true,
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-smartphone-1680-large.mp4',
    text: '📅 **Feature Spotlight: Scheduling**\n\nPlan your messages perfectly. You can now schedule messages to be sent at a specific time.\n\n**How to use:**\n1. Type your message.\n2. **Long press** the Send button.\n3. Select "Schedule Message".\n\nSee it in action below! 👇'
  },
  {
    id: 'n3',
    senderId: 'news-bot',
    timestamp: '14:30',
    isRead: true,
    type: 'text',
    text: '🚀 **Update v0.0.1.2 Live Now!**\n\nWe heard your feedback about "skidding" media uploads.\n\n📸 **Fixed Skidding**: We implemented a new client-side compression engine. Photos now upload instantly without lagging the interface.\n\n💎 **Zippers Balance**: You can now view your exact Zippers balance directly in Settings.\n\n⚡ **Performance**: General stability improvements.\n\nUpdate is live automatically. Enjoy!'
  }
];
