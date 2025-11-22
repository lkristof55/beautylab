"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Otvori login modal i redirect na homepage
        if (typeof window !== "undefined") {
            (window as any).openLoginModal?.();
            router.replace("/");
        }
    }, [router]);

    return null;
}