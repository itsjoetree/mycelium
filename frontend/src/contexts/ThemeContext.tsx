import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMyProfile } from '../hooks/useUsers';
import { useUserSession } from '../hooks/useAuth';

interface ThemeContextType {
    accentColor: string;
    setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session } = useUserSession();
    const { data: profile } = useMyProfile();
    const [accentColor, setAccentColor] = useState('#00ff9d');

    useEffect(() => {
        // Only update if we have a profile with a theme color
        if (profile?.themeColor) {
            setAccentColor(profile.themeColor);
        }
        // Only reset to default if we are specifically logged out
        else if (session === null) {
            setAccentColor('#00ff9d');
        }
    }, [profile, session]);

    useEffect(() => {
        // Apply the accent color to CSS variables
        document.documentElement.style.setProperty('--accent', accentColor);

        // Generate a muted version for backgrounds
        const r = parseInt(accentColor.slice(1, 3), 16);
        const g = parseInt(accentColor.slice(3, 5), 16);
        const b = parseInt(accentColor.slice(5, 7), 16);
        document.documentElement.style.setProperty('--accent-rgb', `${r} ${g} ${b}`);
        document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.15)`);
        document.documentElement.style.setProperty('--accent-border', `rgba(${r}, ${g}, ${b}, 0.3)`);
    }, [accentColor]);

    return (
        <ThemeContext.Provider value={{ accentColor, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
