import React, { createContext, useContext, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Use web client ID for both platforms (Google accepts this)
// Replace with your own Google OAuth credentials
const WEB_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';

// OAuth redirect URI for Vercel deployment
// Updated git config with correct email: pasupuletisatyavardhan@gmail.com
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
];

interface GmailAuthContextType {
    accessToken: string | null;
    user: any;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => void;
    isMockMode: boolean;
}

const GmailAuthContext = createContext<GmailAuthContextType | undefined>(undefined);

export const GmailAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isMockMode, setIsMockMode] = useState(false);

    // Check for access token in URL hash on component mount (for web redirect)
    React.useEffect(() => {
        if (Platform.OS === 'web') {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            
            if (accessToken) {
                setAccessToken(accessToken);
                fetchUserInfo(accessToken);
                // Clear the hash from URL
                window.location.hash = '';
            }
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        setIsLoading(true);
        try {
            if (Platform.OS === 'web') {
                // Web authentication
                await signInWithGoogleWeb();
            } else {
                // Mobile authentication using WebBrowser
                await signInWithGoogleMobile();
            }
        } catch (error) {
            console.error('Sign in error:', error);
            setIsLoading(false);
        }
    }, []);

    const signInWithGoogleWeb = async () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zeston.vercel.app';
        const redirectUri = `${origin}/`;
        const authUrl =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${WEB_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=token` +
            `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
            `&prompt=consent`;

        // For web, redirect directly
        window.location.href = authUrl;
    };

    const signInWithGoogleMobile = async () => {
        try {
            console.log('📱 Starting mobile OAuth...');
            
            // Use the origin so the SPA can parse the hash on load
            const origin = Platform.OS === 'web' && typeof window !== 'undefined'
                ? window.location.origin
                : 'https://zeston.vercel.app';
            const redirectUri = `${origin}/`;
            
            // Build the OAuth URL
            const authUrl =
                `https://accounts.google.com/o/oauth2/v2/auth` +
                `?client_id=${WEB_CLIENT_ID}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_type=token` +
                `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
                `&prompt=consent`;

            console.log('🔗 Auth URL:', authUrl);
            console.log('📱 Opening WebBrowser...');

            // Open the auth URL in WebBrowser
            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

            console.log('📱 WebBrowser result:', result);

            if (result.type === 'success' && result.url) {
                // Parse the access token from the URL
                const url = new URL(result.url);
                const hash = url.hash.substring(1);
                const params = new URLSearchParams(hash);
                const accessToken = params.get('access_token');

                if (accessToken) {
                    console.log('✅ Got access token:', accessToken.substring(0, 20) + '...');
                    setAccessToken(accessToken);
                    await fetchUserInfo(accessToken);
                } else {
                    console.error('❌ No access token found in URL');
                }
            } else if (result.type === 'cancel') {
                console.log('❌ User cancelled OAuth');
            } else {
                console.error('❌ OAuth failed:', result);
            }
        } catch (error) {
            console.error('❌ Mobile OAuth error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserInfo = async (token: string) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                console.log('👤 User info:', userData);
            } else {
                console.error('❌ Failed to fetch user info:', response.status);
            }
        } catch (error) {
            console.error('❌ Error fetching user info:', error);
        }
    };

    const signOut = () => {
        setAccessToken(null);
        setUser(null);
        console.log('👋 User signed out');
    };

    const value: GmailAuthContextType = {
        accessToken,
        user,
        isLoading,
        signInWithGoogle,
        signOut,
        isMockMode,
    };

    return (
        <GmailAuthContext.Provider value={value}>
            {children}
        </GmailAuthContext.Provider>
    );
};

export const useGmailAuth = (): GmailAuthContextType => {
    const context = useContext(GmailAuthContext);
    if (context === undefined) {
        throw new Error('useGmailAuth must be used within a GmailAuthProvider');
    }
    return context;
};