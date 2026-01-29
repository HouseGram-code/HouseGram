
import React, { useState } from 'react';
import { User as UserIcon, Mail, Key, Send, AtSign, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';
import { auth, db } from '../firebase.ts';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, query, where, getDocs, collection } from "firebase/firestore";
import { User } from '../types.ts';

const AuthScreen: React.FC = () => {
  const { t } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const isFormValid = isRegistering 
    ? (name.length > 0 && email.includes('@') && password.length >= 6 && username.length > 0)
    : (email.includes('@') && password.length >= 6);

  const checkUsernameExists = async (u: string) => {
     const q = query(collection(db, "users"), where("username", "==", u));
     const snap = await getDocs(q);
     return !snap.empty;
  };

  const handleSubmit = async () => {
    if (!isFormValid || loading) return;
    setLoading(true);
    setError(null);

    try {
        if (isRegistering) {
            const finalUsername = username.startsWith('@') ? username : `@${username}`;
            const exists = await checkUsernameExists(finalUsername);
            if (exists) throw new Error("Username already taken");

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });

            const isOfficial = email.toLowerCase() === 'goh@gmail.com';
            const newUser: User = {
                id: user.uid,
                name: name,
                email: email,
                username: finalUsername,
                phone: '',
                avatarColor: 'bg-tg-accent',
                status: 'online',
                isOfficial: isOfficial,
                isAdmin: isOfficial,
                zippers: 100, // Начальный баланс
                gifts: [],
                bio: 'Hi there! I am using HouseGram.'
            };

            await setDoc(doc(db, "users", user.uid), newUser);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        
        setIsSuccess(true);
        // Задержка для анимации самолетика
        await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (err: any) {
        console.error("Auth Error:", err);
        setError(err.message);
        setIsSuccess(false);
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#0E1621] p-6 overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_50%,rgba(42,171,238,0.1),transparent_60%)] pointer-events-none" />

        <div className={`relative w-full max-w-sm flex flex-col items-center transition-all duration-700 ${isSuccess ? 'scale-90 opacity-0 translate-y-[-20px]' : 'opacity-100'}`}>
            
            {/* Анимированный самолетик */}
            <div className={`mb-8 relative group ${isSuccess ? 'animate-fly-away' : ''}`}>
                <div className="w-32 h-32 bg-[#1C242F] rounded-full flex items-center justify-center shadow-2xl border border-white/5 relative z-10 transition-transform group-hover:scale-105">
                    <Send className="text-tg-accent w-16 h-16 relative left-[-2px] top-[2px]" fill="currentColor" />
                </div>
                {!isSuccess && <div className="absolute inset-0 bg-tg-accent/20 rounded-full blur-2xl animate-pulse" />}
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{t('appName')}</h1>
            <p className="text-tg-secondary mb-8 text-center text-sm">
                {isRegistering ? "Join the most powerful messenger." : "Securely log into your account."}
            </p>

            {error && (
                <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center space-x-3 text-red-400 text-sm mb-6 animate-fadeIn">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="w-full space-y-4">
                {isRegistering && (
                    <>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <UserIcon size={20} className="text-tg-secondary group-focus-within:text-tg-accent" />
                            </div>
                            <input
                                type="text"
                                placeholder={t('fullName')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3.5 bg-[#17212B] border border-white/5 rounded-xl text-white outline-none focus:border-tg-accent transition-all"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <AtSign size={20} className="text-tg-secondary group-focus-within:text-tg-accent" />
                            </div>
                            <input
                                type="text"
                                placeholder={t('username')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3.5 bg-[#17212B] border border-white/5 rounded-xl text-white outline-none focus:border-tg-accent transition-all"
                            />
                        </div>
                    </>
                )}

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={20} className="text-tg-secondary group-focus-within:text-tg-accent" />
                    </div>
                    <input
                        type="email"
                        placeholder={t('email')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3.5 bg-[#17212B] border border-white/5 rounded-xl text-white outline-none focus:border-tg-accent transition-all"
                    />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Key size={20} className="text-tg-secondary group-focus-within:text-tg-accent" />
                    </div>
                    <input
                        type="password"
                        placeholder={t('password')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3.5 bg-[#17212B] border border-white/5 rounded-xl text-white outline-none focus:border-tg-accent transition-all"
                    />
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={!isFormValid || loading}
                className={`w-full mt-8 py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-2 ${
                    isFormValid && !loading
                        ? 'bg-tg-accent text-white shadow-lg shadow-tg-accent/30 hover:brightness-110 active:scale-95' 
                        : 'bg-[#17212B] text-tg-secondary opacity-50 cursor-not-allowed'
                }`}
            >
                {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                        <span>{isRegistering ? t('createAccount') : t('login')}</span>
                        {!loading && <ArrowRight size={20} />}
                    </>
                )}
            </button>

            <div className="mt-6">
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                    className="text-tg-accent hover:text-white transition-colors text-sm font-medium"
                >
                    {isRegistering ? t('haveAccount') : t('noAccount')}
                </button>
            </div>
        </div>
    </div>
  );
};

export default AuthScreen;
