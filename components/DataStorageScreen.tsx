
import React from 'react';
import { ArrowLeft, Database, FileText, Image, Mic, Film, PieChart } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';
import { MAX_STORAGE_BYTES } from '../constants.ts';
import { StorageStats } from '../types.ts';

interface DataStorageScreenProps {
  onBack: () => void;
  storageStats: StorageStats;
}

const DataStorageScreen: React.FC<DataStorageScreenProps> = ({ onBack, storageStats }) => {
  const { t } = useLanguage();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalUsed = storageStats.total;
  const percentage = Math.min(100, (totalUsed / MAX_STORAGE_BYTES) * 100);
  const freeSpace = MAX_STORAGE_BYTES - totalUsed;

  return (
    <div className="flex flex-col h-full w-full bg-tg-bg overflow-hidden animate-fadeIn relative">
      <div className="z-20 bg-tg-sidebar px-4 py-3 flex items-center shadow-md border-b border-black/5 dark:border-white/5">
        <button onClick={onBack} className="p-2 -ml-2 text-tg-text hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors active:scale-90">
          <ArrowLeft size={24} />
        </button>
        <span className="text-tg-text font-bold text-xl ml-4">{t('data')}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        
        {/* Storage Graph */}
        <div className="flex flex-col items-center mb-8">
            <div className="relative w-48 h-48 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                    {/* Background Circle */}
                    <circle 
                        cx="96" cy="96" r="88" 
                        fill="transparent" 
                        stroke="#17212B" 
                        strokeWidth="16" 
                        className="stroke-black/10 dark:stroke-white/5"
                    />
                    {/* Progress Circle */}
                    <circle 
                        cx="96" cy="96" r="88" 
                        fill="transparent" 
                        stroke="#2AABEE" 
                        strokeWidth="16" 
                        strokeDasharray={2 * Math.PI * 88} 
                        strokeDashoffset={2 * Math.PI * 88 * (1 - percentage / 100)} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-tg-text">{percentage.toFixed(1)}%</span>
                    <span className="text-xs text-tg-secondary uppercase font-bold tracking-wider">Used</span>
                </div>
            </div>

            <div className="text-center">
                <p className="text-tg-text text-lg font-bold">
                    {formatBytes(totalUsed)} <span className="text-tg-secondary font-normal">of</span> {formatBytes(MAX_STORAGE_BYTES)}
                </p>
                <p className="text-tg-secondary text-sm mt-1">
                    Free space: {formatBytes(freeSpace)}
                </p>
            </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-tg-sidebar rounded-xl overflow-hidden border border-black/5 dark:border-white/5">
            <div className="px-5 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                        <Image size={18} />
                    </div>
                    <span className="text-tg-text font-medium">Photos & Videos</span>
                </div>
                <span className="text-tg-text font-bold">{formatBytes(storageStats.media)}</span>
            </div>
            
            <div className="px-5 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center">
                        <FileText size={18} />
                    </div>
                    <span className="text-tg-text font-medium">Files</span>
                </div>
                <span className="text-tg-text font-bold">{formatBytes(storageStats.files)}</span>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center">
                        <Mic size={18} />
                    </div>
                    <span className="text-tg-text font-medium">Voice Messages</span>
                </div>
                <span className="text-tg-text font-bold">{formatBytes(storageStats.voice)}</span>
            </div>
        </div>

        <div className="mt-6 text-center text-xs text-tg-secondary leading-relaxed px-4">
            Files sent in chats are stored in the mesh cloud. Storage is limited to 4GB per account. Older files may be removed if limit is exceeded.
        </div>

      </div>
    </div>
  );
};

export default DataStorageScreen;
