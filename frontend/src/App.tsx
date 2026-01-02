import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './index.css';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Social } from './pages/Social';
import { Notifications } from './pages/Notifications';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <BrowserRouter>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard?view=marketplace" replace />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/social" element={<Social />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </Layout>
                </BrowserRouter>
            </ThemeProvider>
            <Toaster
                position="top-right"
                toastOptions={{
                    className: '!bg-black !border !border-primary/30 !text-white !shadow-[0_0_20px_var(--accent-glow)] font-mono',
                    style: {
                        background: '#000000',
                        color: '#ffffff',
                    }
                }}
            />
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}

export default App;
