
import React, { useState } from 'react';
import { User as UserIcon, Mail, Key, Send, ShieldCheck, AtSign, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext.tsx';
import { auth, db } from '../firebase.ts';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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
            if (exists) {
                throw new Error("Username already taken");
            }

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
                bio: 'Hi there! I am using HouseGram.'
            };

            await setDoc(doc(db, "users", user.uid), newUser);

        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        
        setIsSuccess(true);
        await new Promise(resolve => setTimeout(resolve, 800));

    } catch (err: any) {
        console.error("Auth Error:", err);
        let msg = err.message;
        
        if (err.code === 'auth/email-already-in-use') msg = "This email is already registered.";
        else if (err.code === 'auth/invalid-credential') msg = "Incorrect email or password.";
        else if (err.code === 'auth/user-not-found') msg = "User not found.";
        else if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
        else if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
        else if (msg.includes('Username already taken')) msg = "Username already taken.";
        else msg = "An error occurred. Please try again.";

        setError(msg);
        setIsSuccess(false);
    } finally {
        if (!isSuccess) setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-6 h-full overflow-y-auto no-scrollbar relative pb-safe">
      <div className="flex-1 flex flex-col items-center justify-center w-full space-y-10 min-h-[600px]">
        
        <div className={`relative flex flex-col items-center transition-all duration-1000 ${isSuccess ? 'animate-fly-away' : 'animate-fly-in'}`}>
            <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-[#1c1c1e] to-black flex items-center justify-center shadow-2xl shadow-blue-500/10 border border-white/10">
            <div className={`${!isSuccess ? 'animate-plane-float' : ''}`}>
                <Send className="text-tg-accent w-16 h-16 filter drop-shadow-[0_0_15px_rgba(42,171,238,0.5)]" fill="currentColor" />
            </div>
            </div>
        </div>

        <div className={`w-full max-w-sm text-center space-y-6 animate-form-entrance ${isSuccess ? 'opacity-0 transition-opacity duration-500' : ''}`}>
            <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">{t('appName')}</h1>
            <p className="text-[15px] text-tg-secondary font-medium">
                {isRegistering ? t('createAccount') : t('login')}
            </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3 text-red-400 text-sm text-left animate-fadeIn backdrop-blur-sm">
                    <AlertCircle size={18} className="shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <div className="w-full space-y-4">
            {isRegistering && (
                <>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserIcon size={20} className="text-tg-secondary group-focus-within:text-tg-accent transition-colors duration-300" />
                        </div>
                        <input
                        type="text"
                        placeholder={t('fullName')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-tg-secondary focus:outline-none focus:border-tg-accent/50 focus:ring-1 focus:ring-tg-accent/50 transition-all duration-300 text-[16px] backdrop-blur-sm"
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <AtSign size={20} className="text-tg-secondary group-focus-within:text-tg-accent transition-colors duration-300" />
                        </div>
                        <input
                        type="text"
                        placeholder={t('username')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-tg-secondary focus:outline-none focus:border-tg-accent/50 focus:ring-1 focus:ring-tg-accent/50 transition-all duration-300 text-[16px] backdrop-blur-sm"
                        />
                    </div>
                </>
            )}

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={20} className="text-tg-secondary group-focus-within:text-tg-accent transition-colors duration-300" />
                </div>
                <input
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-tg-secondary focus:outline-none focus:border-tg-accent/50 focus:ring-1 focus:ring-tg-accent/50 transition-all duration-300 text-[16px] backdrop-blur-sm"
                />
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key size={20} className="text-tg-secondary group-focus-within:text-tg-accent transition-colors duration-300" />
                </div>
                <input
                type="password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-tg-secondary focus:outline-none focus:border-tg-accent/50 focus:ring-1 focus:ring-tg-accent/50 transition-all duration-300 text-[16px] backdrop-blur-sm"
                />
            </div>
            </div>

            <div className="pt-4">
            <button
                onClick={handleSubmit}
                disabled={!isFormValid || loading}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center ${
                isFormValid && !loading
                    ? 'bg-gradient-to-r from-tg-accent to-blue-600 text-white shadow-xl shadow-blue-500/30 cursor-pointer hover:shadow-blue-500/40 hover:brightness-110' 
                    : 'bg-white/5 text-tg-secondary opacity-50 cursor-not-allowed border border-white/10'
                }`}
            >
                {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? t('createAccount') : t('continue'))}
            </button>
            </div>

            <div className="flex flex-col items-center space-y-4">
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                    className="text-tg-accent hover:text-white transition-colors text-sm font-medium py-2"
                >
                    {isRegistering ? t('haveAccount') : t('noAccount')} <span className="underline decoration-tg-accent/50 underline-offset-4">{isRegistering ? t('login') : t('signup')}</span>
                </button>

                <div className="flex items-center justify-center space-x-2 text-sm text-tg-secondary pb-4 opacity-70">
                    <ShieldCheck size={14} className="text-tg-online" />
                    <p className="text-xs font-medium">Secure connection established</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
