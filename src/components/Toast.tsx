"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

const addToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type };
    toasts = [...toasts, newToast];
    toastListeners.forEach((listener) => listener(toasts));

    // Auto remove after 5 seconds
    setTimeout(() => {
        removeToast(id);
    }, 5000);
};

const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((listener) => listener(toasts));
};

export const toast = {
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
    warning: (message: string) => addToast(message, "warning"),
};

export default function ToastContainer() {
    const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const listener = (newToasts: Toast[]) => {
            setCurrentToasts(newToasts);
        };
        toastListeners.push(listener);
        setCurrentToasts(toasts);

        return () => {
            toastListeners = toastListeners.filter((l) => l !== listener);
        };
    }, []);

    const getToastStyles = (type: ToastType) => {
        switch (type) {
            case "success":
                return {
                    background: "#10b981",
                    color: "white",
                    borderColor: "#059669",
                };
            case "error":
                return {
                    background: "#ef4444",
                    color: "white",
                    borderColor: "#dc2626",
                };
            case "warning":
                return {
                    background: "#f59e0b",
                    color: "white",
                    borderColor: "#d97706",
                };
            case "info":
            default:
                return {
                    background: "#3b82f6",
                    color: "white",
                    borderColor: "#2563eb",
                };
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: "1rem",
                right: "1rem",
                zIndex: 10000,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxWidth: "400px",
            }}
        >
            {currentToasts.map((toast) => (
                <div
                    key={toast.id}
                    onClick={() => removeToast(toast.id)}
                    style={{
                        ...getToastStyles(toast.type),
                        padding: "1rem 1.25rem",
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        animation: "slideIn 0.3s ease-out",
                        border: "1px solid",
                    }}
                >
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeToast(toast.id);
                        }}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "1.25rem",
                            lineHeight: 1,
                            padding: 0,
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

