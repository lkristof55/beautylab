"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Vrijeme neaktivnosti prije automatskog logout-a (30 minuta u milisekundama)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minuta
// Interval provjere neaktivnosti (svakih 30 sekundi)
const CHECK_INTERVAL = 30 * 1000; // 30 sekundi
// Interval za refresh tokena (svakih 50 minuta - prije isteka od 1h)
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minuta

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const tokenRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const refreshToken = useCallback(async (): Promise<boolean> => {
        const token = localStorage.getItem("token");
        if (!token) {
            return false;
        }

        try {
            const res = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("token", data.token);
                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    setUser(data.user);
                }
                return true;
            } else {
                // Token refresh neuspješan, logout korisnika
                logout();
                return false;
            }
        } catch (error) {
            console.error("Greška pri osvježavanju tokena:", error);
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("lastActivity");
        setUser(null);
        
        // Očisti timere
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
        }
        if (tokenRefreshIntervalRef.current) {
            clearInterval(tokenRefreshIntervalRef.current);
            tokenRefreshIntervalRef.current = null;
        }
    }, []);

    const updateLastActivity = useCallback(() => {
        const currentUser = localStorage.getItem("user");
        if (currentUser) {
            localStorage.setItem("lastActivity", Date.now().toString());
        }
    }, []);

    const checkInactivity = useCallback(() => {
        const currentUser = localStorage.getItem("user");
        if (!currentUser) {
            setUser(null);
            return;
        }

        const lastActivity = localStorage.getItem("lastActivity");
        if (!lastActivity) {
            updateLastActivity();
            return;
        }

        const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
        
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
            // Automatski logout nakon 30 minuta neaktivnosti
            logout();
        }
    }, [updateLastActivity, logout]);

    const login = (user: User, token: string) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("lastActivity", Date.now().toString());
        setUser(user);
    };

    useEffect(() => {
        // Učitaj korisnika iz localStorage pri inicijalizaciji
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            // Provjeri neaktivnost prije nego što učitaš korisnika
            const lastActivity = localStorage.getItem("lastActivity");
            if (lastActivity) {
                const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
                if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
                    // Korisnik je bio neaktivan preko 30 minuta, očisti sve
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    localStorage.removeItem("lastActivity");
                    return;
                }
            }
            
            setUser(JSON.parse(storedUser));
            // Postavi lastActivity ako ne postoji
            if (!localStorage.getItem("lastActivity")) {
                localStorage.setItem("lastActivity", Date.now().toString());
            }
        }
    }, []);

    useEffect(() => {
        if (!user) {
            // Ako nema korisnika, očisti timere
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }
            if (tokenRefreshIntervalRef.current) {
                clearInterval(tokenRefreshIntervalRef.current);
                tokenRefreshIntervalRef.current = null;
            }
            return;
        }

        // Postavi event listenere za praćenje aktivnosti
        const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
        
        const handleActivity = () => {
            updateLastActivity();
        };

        // Handler za kada se tab vrati u fokus
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Provjeri neaktivnost kada se tab vrati u fokus
                checkInactivity();
                updateLastActivity();
            }
        };

        // Dodaj event listenere
        activityEvents.forEach((event) => {
            window.addEventListener(event, handleActivity, true);
        });
        
        // Dodaj listener za promjenu vidljivosti taba
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Postavi interval za provjeru neaktivnosti
        checkIntervalRef.current = setInterval(() => {
            checkInactivity();
        }, CHECK_INTERVAL);

        // Postavi interval za refresh tokena (svakih 50 minuta)
        tokenRefreshIntervalRef.current = setInterval(() => {
            refreshToken();
        }, TOKEN_REFRESH_INTERVAL);

        // Provjeri neaktivnost odmah
        checkInactivity();
        
        // Ne pozivaj refreshToken odmah - interval će to obaviti kada bude potrebno

        // Cleanup funkcija
        return () => {
            activityEvents.forEach((event) => {
                window.removeEventListener(event, handleActivity, true);
            });
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }
            if (tokenRefreshIntervalRef.current) {
                clearInterval(tokenRefreshIntervalRef.current);
                tokenRefreshIntervalRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Samo user dependency - funkcije su stable zbog useCallback

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error("useAuth mora biti unutar AuthProvider-a");
    return context;
};
