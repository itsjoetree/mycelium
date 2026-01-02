import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useLogin, useRegister, useUserSession } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';

export const Login: React.FC = () => {
    const { t } = useTranslation();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const navigate = useNavigate();
    const login = useLogin();
    const register = useRegister();
    const { data: session } = useUserSession();

    useEffect(() => {
        if (session) {
            navigate('/dashboard');
        }
    }, [session, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isRegistering) {
                await register.mutateAsync({ email, password, username });
                toast.success(t('auth.messages.register_success'));
                setIsRegistering(false);
            } else {
                await login.mutateAsync({ email, password });
                toast.success(t('auth.messages.login_success'));
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || t('auth.messages.failed'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            <div className="w-full max-w-sm flex flex-col gap-8 z-10">
                <div className="text-center">
                    <Logo className="w-20 h-20 mx-auto mb-4" />
                    <h1 className="text-5xl mb-1 shadow-neon text-primary">Mycelium</h1>
                    <p className="font-mono text-text-muted text-sm tracking-widest uppercase">{t('auth.subtitle', 'Decentralized Urban Exchange')}</p>
                </div>

                <Card>
                    <h2 className="text-center mb-8 text-2xl">{isRegistering ? t('auth.title.register') : t('auth.title.login')}</h2>

                    <form onSubmit={handleSubmit}>
                        {isRegistering && (
                            <Input
                                label={t('auth.fields.username')}
                                placeholder={t('auth.fields.username_placeholder')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        )}
                        <Input
                            label={t('auth.fields.email')}
                            type="email"
                            placeholder={t('auth.fields.email_placeholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label={t('auth.fields.password')}
                            type="password"
                            placeholder={t('auth.fields.password_placeholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <div className="mt-8">
                            <Button
                                type="submit"
                                isLoading={login.isPending || register.isPending}
                                className="w-full"
                            >
                                {isRegistering ? t('auth.submit.register') : t('auth.submit.login')}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            className="bg-none border-none text-text-muted font-mono text-xs underline cursor-pointer transition-colors duration-300 hover:text-primary"
                            onClick={() => setIsRegistering(!isRegistering)}
                        >
                            {isRegistering ? t('auth.toggle.to_login') : t('auth.toggle.to_register')}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
