"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        // Otvori register modal i redirect na homepage
        if (typeof window !== "undefined") {
            (window as any).openRegisterModal?.();
            router.replace("/");
        }
    }, [router]);

    return null;
}