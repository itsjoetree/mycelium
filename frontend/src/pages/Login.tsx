import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useLogin, useRegister } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';

export const Login: React.FC = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const navigate = useNavigate();
    const login = useLogin();
    const register = useRegister();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isRegistering) {
                await register.mutateAsync({ email, password, username });
                toast.success('Registration successful! Please log in.');
                setIsRegistering(false);
            } else {
                await login.mutateAsync({ email, password });
                toast.success('Logged in successfully');
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            <div className="w-full max-w-sm flex flex-col gap-8 z-10">
                <div className="text-center">
                    <Logo className="w-20 h-20 mx-auto mb-4" />
                    <h1 className="text-5xl mb-1 shadow-neon text-primary">Mycelium</h1>
                    <p className="font-mono text-text-muted text-sm tracking-widest uppercase">Decentralized Urban Exchange</p>
                </div>

                <Card>
                    <h2 className="text-center mb-8 text-2xl">{isRegistering ? 'Join the Network' : 'Access Node'}</h2>

                    <form onSubmit={handleSubmit}>
                        {isRegistering && (
                            <Input
                                label="Username"
                                placeholder="Choose a handle"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        )}
                        <Input
                            label="Email"
                            type="email"
                            placeholder="Enter your signal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="*************"
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
                                {isRegistering ? 'Initialize' : 'Connect'}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            className="bg-none border-none text-text-muted font-mono text-xs underline cursor-pointer transition-colors duration-300 hover:text-primary"
                            onClick={() => setIsRegistering(!isRegistering)}
                        >
                            {isRegistering ? 'Already a node? Login' : 'New structure? Register'}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
