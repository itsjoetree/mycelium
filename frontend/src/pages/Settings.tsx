import React from 'react';
import { useUserSession } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useMyProfile, useUpdateProfile } from '../hooks/useUsers';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { SocialLoading } from '../components/SocialLoading';

export const Settings: React.FC = () => {
    const { data: session, isLoading: sessionLoading } = useUserSession();
    const { data: profile, isLoading: profileLoading } = useMyProfile();
    const updateProfile = useUpdateProfile();

    const [bio, setBio] = React.useState('');
    const [themeColor, setThemeColor] = React.useState('#00ff9d');

    React.useEffect(() => {
        if (profile) {
            setBio(profile.bio || '');
            setThemeColor(profile.themeColor || '#00ff9d');
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            await updateProfile.mutateAsync({ bio, themeColor });
            toast.success('Profile updated');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to update profile');
        }
    };

    const isLoading = sessionLoading || profileLoading;

    if (isLoading) return <SocialLoading message="Retrieving Node Configuration..." />;
    if (!session) return <div className="loading-screen">Unauthorized</div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-8 pb-2 border-b border-glass-surface">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="text-primary hover:text-white transition-colors duration-200">
                        <span className="font-mono">&lt; Dashboard</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-text-main">Settings / Profile</h1>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card className="flex flex-col items-center p-8 border-primary/30" style={{ borderColor: themeColor + '66' }}>
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center border-2 mb-4 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                            style={{
                                backgroundColor: themeColor + '33',
                                borderColor: themeColor,
                                color: themeColor
                            }}
                        >
                            <span className="font-mono text-3xl uppercase">{session.username[0]}</span>
                        </div>
                        <h2 className="text-xl font-bold">{session.username}</h2>
                        <p className="text-text-muted font-mono text-xs mt-1">Node #{session.id}</p>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6 border-glass-surface">
                        <h3 className="mb-4 text-primary uppercase tracking-widest text-xs" style={{ color: themeColor }}>Profile Customization</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[0.6rem] uppercase text-text-muted mb-1 font-semibold">Bio / Transmission Note</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell the network about yourself..."
                                    className="w-full bg-bg-deep border border-glass-surface px-4 py-3 rounded-sm text-text-main font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors h-24 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.6rem] uppercase text-text-muted mb-1 font-semibold">Node Theme Color</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="color"
                                        value={themeColor}
                                        onChange={(e) => setThemeColor(e.target.value)}
                                        className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={themeColor}
                                        onChange={(e) => setThemeColor(e.target.value)}
                                        className="bg-bg-deep border border-glass-surface px-4 py-2 rounded-sm text-text-main font-mono text-sm w-32 uppercase"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleSave}
                                className="w-full"
                                isLoading={updateProfile.isPending}
                                style={{ backgroundColor: themeColor + '22', borderColor: themeColor, color: themeColor }}
                            >
                                Sync Profile Changes
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6 border-glass-surface">
                        <h3 className="mb-4 text-text-muted uppercase tracking-widest text-xs">Identity Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[0.6rem] uppercase text-text-muted mb-1 font-semibold">Username</label>
                                <div className="bg-bg-deep border border-glass-surface px-4 py-[10px] rounded-sm text-text-main font-mono text-sm opacity-60">
                                    {session.username}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[0.6rem] uppercase text-text-muted mb-1 font-semibold">Email Address</label>
                                <div className="bg-bg-deep border border-glass-surface px-4 py-[10px] rounded-sm text-text-main font-mono text-sm opacity-60">
                                    {session.email}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-secondary/20 bg-secondary/5">
                        <h3 className="mb-4 text-secondary uppercase tracking-widest text-xs">Danger Zone</h3>
                        <p className="text-sm text-text-muted mb-4 font-mono">
                            Modifying core identity parameters requires higher authority clearance.
                            Contact Central Command for node decommissioning or ID changes.
                        </p>
                        <Button variant="secondary" className="border-secondary/50 text-secondary bg-transparent hover:bg-secondary/10" disabled>
                            Request ID Change
                        </Button>
                    </Card>
                </div>
            </main>

            <style>{`
                .loading-screen {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                }
            `}</style>
        </div>
    );
};
