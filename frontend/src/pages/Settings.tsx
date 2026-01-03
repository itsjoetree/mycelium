import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserSession } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useMyProfile, useUpdateProfile } from '../hooks/useUsers';
import { toast } from 'sonner';
import { GlobalLoading } from '../components/GlobalLoading';

export const Settings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { data: session, isLoading: sessionLoading } = useUserSession();
    const { data: profile, isLoading: profileLoading } = useMyProfile();
    const updateProfile = useUpdateProfile();

    const [bio, setBio] = React.useState('');
    const [themeColor, setThemeColor] = React.useState('#00ff9d');
    const [language, setLanguage] = React.useState(i18n.resolvedLanguage || 'en');

    React.useEffect(() => {
        if (profile) {
            setBio(profile.bio || '');
            setThemeColor(profile.themeColor || '#00ff9d');
        }
    }, [profile]);

    React.useEffect(() => {
        setLanguage(i18n.resolvedLanguage || 'en');
    }, [i18n.resolvedLanguage]);

    const handleSave = async () => {
        try {
            await updateProfile.mutateAsync({ bio, themeColor });
            if (language !== i18n.resolvedLanguage) {
                await i18n.changeLanguage(language);
            }
            toast.success('Neural profile synchronized');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to sync profile');
        }
    };

    const isLoading = sessionLoading || profileLoading;

    if (isLoading) return <GlobalLoading message="Retrieving Node Configuration..." />;
    if (!session) return null;

    return (
        <div className="flex-1 p-6 md:p-10 pt-8 bg-black h-full overflow-y-auto custom-scrollbar">
            <header className="max-w-4xl mx-auto mb-10">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2 uppercase">{t('settings.title')}</h1>
                <p className="text-text-muted font-mono text-[0.6rem] uppercase tracking-[0.4em]">{t('settings.profile')}</p>
            </header>

            <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="md:col-span-1">
                    <Card className="flex flex-col items-center p-8 border-primary/20 bg-white/[0.02] !rounded-2xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center border-4 mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-10 transition-transform duration-500 group-hover:scale-110"
                            style={{
                                backgroundColor: themeColor + '22',
                                borderColor: themeColor,
                                color: themeColor,
                                boxShadow: `0 0 20px ${themeColor}33`
                            }}
                        >
                            <span className="font-mono text-4xl uppercase font-bold">{session.username[0]}</span>
                        </div>
                        <h2 className="text-xl font-bold text-white relative z-10">@{session.username}</h2>
                        <p className="text-primary font-mono text-[0.6rem] mt-2 uppercase tracking-widest relative z-10">{t('settings.identity.status', 'Node Status: Online')}</p>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-8">
                    <Card className="p-8 border-white/5 bg-white/[0.02] !rounded-2xl shadow-2xl">
                        <h3 className="mb-6 text-primary tracking-[0.3em] font-bold text-xs uppercase" style={{ color: themeColor }}>{t('settings.profile_uplink', 'Profile Uplink')}</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[0.6rem] uppercase text-text-muted mb-2 font-bold tracking-widest">{t('settings.bio_label', 'Neural Transmission Note (Bio)')}</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder={t('settings.bio_placeholder', 'Input signal data...')}
                                    className="w-full bg-black/40 border border-white/5 px-4 py-4 rounded-xl text-text-main font-mono text-xs h-32 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.6rem] uppercase text-text-muted mb-3 font-bold tracking-widest">{t('settings.theme', 'Visual Protocol')}</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { color: '#00ff9d', name: 'Neon Mycelium' },
                                        { color: '#ff2a6d', name: 'Nebula Pink' },
                                        { color: '#00e5ff', name: 'Quantum Blue' },
                                        { color: '#d500f9', name: 'Void Purple' },
                                        { color: '#ff9100', name: 'Solar Orange' },
                                    ].map((theme) => (
                                        <button
                                            key={theme.color}
                                            onClick={() => setThemeColor(theme.color)}
                                            className={`group relative flex flex-col items-center gap-2 p-2 rounded-xl border transition-all duration-300 ${themeColor === theme.color
                                                ? 'bg-white/10 border-white/20 ring-1 ring-white/20'
                                                : 'bg-transparent border-transparent hover:bg-white/5'
                                                }`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full shadow-lg transition-transform duration-300 ${themeColor === theme.color ? 'scale-110' : 'group-hover:scale-110'
                                                    }`}
                                                style={{ backgroundColor: theme.color, boxShadow: `0 0 10px ${theme.color}44` }}
                                            />
                                            <span className={`text-[0.45rem] font-mono uppercase tracking-wider text-center leading-tight ${themeColor === theme.color ? 'text-white' : 'text-text-muted group-hover:text-white'
                                                }`}>
                                                {theme.name.split(' ').map((word, i) => (
                                                    <span key={i} className="block">{word}</span>
                                                ))}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[0.6rem] uppercase text-text-muted mb-3 font-bold tracking-widest">{t('settings.language_protocol', 'Language Protocol')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { code: 'en', name: 'English' },
                                        { code: 'es', name: 'Español' },
                                        { code: 'fr', name: 'Français' },
                                    ].map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setLanguage(lang.code)}
                                            className={`py-3 rounded-xl border transition-all duration-300 font-mono text-[0.6rem] uppercase tracking-wider ${language === lang.code
                                                ? 'bg-white/10 border-white/20 text-white shadow-inner'
                                                : 'bg-transparent border-transparent text-text-muted hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Button
                                onClick={handleSave}
                                className="w-full h-12 text-sm uppercase tracking-[0.2em] font-bold shadow-[0_0_15px_var(--accent-glow)] mt-4"
                                isLoading={updateProfile.isPending}
                                style={{ backgroundColor: themeColor + '11', borderColor: themeColor + '44', color: themeColor }}
                            >
                                {t('settings.save_changes')}
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-8 border-white/5 bg-white/[0.01] !rounded-2xl shadow-xl opacity-60">
                        <h3 className="mb-6 text-text-muted uppercase tracking-widest text-[0.6rem] font-bold">{t('settings.identity.title', 'Hardcoded Identity Parameters')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[0.55rem] uppercase text-text-muted mb-1 font-bold tracking-tighter">{t('settings.identity.system_id', 'System ID')}</label>
                                <div className="font-mono text-xs text-white">#NODE_{session.id.toString().padStart(4, '0')}</div>
                            </div>
                            <div>
                                <label className="block text-[0.55rem] uppercase text-text-muted mb-1 font-bold tracking-tighter">{t('settings.identity.email', 'Registration Email')}</label>
                                <div className="font-mono text-xs text-white truncate">{session.email}</div>
                            </div>
                        </div>
                    </Card>

                    <div className="p-6 border border-red-500/10 bg-red-500/5 rounded-2xl">
                        <h3 className="mb-3 text-red-500 uppercase tracking-widest text-[0.6rem] font-bold">{t('settings.danger.title', 'Terminal protocol')}</h3>
                        <p className="text-[0.6rem] text-text-muted mb-4 font-mono leading-relaxed">
                            {t('settings.danger.text')}
                        </p>
                        <Button variant="secondary" className="border-red-500/20 text-red-500/60 bg-transparent hover:bg-red-500/10 hover:text-red-500 text-[0.6rem] h-8 px-4 font-bold uppercase tracking-widest" disabled>
                            {t('settings.danger.button', 'Request Deletion')}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};
