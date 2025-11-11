import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // TODO: zamijeni ovim pravom provjerom iz tvoje baze
                if (
                    credentials?.email === "demo@beautylab.com" &&
                    credentials?.password === "demo123"
                ) {
                    return { id: "1", name: "Irena", email: "demo@beautylab.com" };
                }
                return null;
            },
        }),
    ],
    pages: {
        // Ako želiš vlastite rute za login/register – ostavi prazno.
        // login page možeš držati na /login i ručno zvati signIn()
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.name = user.name;
                token.email = user.email!;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.name = token.name as string;
                session.user.email = token.email as string;
            }
            return session;
        },
    },
};
