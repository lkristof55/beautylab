import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const admin = await checkAdmin(token);
        if (!admin) {
            return NextResponse.json({ error: "Nemate dozvolu za ovu akciju" }, { status: 403 });
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Novi termini (zadnja 24h)
        const newAppointments = await prisma.appointment.count({
            where: {
                createdAt: {
                    gte: yesterday
                }
            }
        });

        // Današnji termini (još nisu završeni)
        const todayAppointments = await prisma.appointment.count({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                },
                isCompleted: false
            }
        });

        // Novi korisnici (zadnja 24h)
        const newUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: yesterday
                }
            }
        });

        // Nedovršeni termini (stariji od danas, nisu completed)
        const incompleteAppointments = await prisma.appointment.count({
            where: {
                date: {
                    lt: today
                },
                isCompleted: false
            }
        });

        const notifications = [];
        let unreadCount = 0;

        if (newAppointments > 0) {
            notifications.push({
                type: 'new_appointment',
                message: `${newAppointments} nov${newAppointments === 1 ? 'i' : 'ih'} termin${newAppointments === 1 ? '' : 'a'} u zadnja 24h`,
                count: newAppointments,
                priority: 'info',
                icon: '📅'
            });
            unreadCount += newAppointments;
        }

        if (todayAppointments > 0) {
            notifications.push({
                type: 'today_appointment',
                message: `${todayAppointments} termin${todayAppointments === 1 ? '' : 'a'} danas`,
                count: todayAppointments,
                priority: 'warning',
                icon: '🔔'
            });
            unreadCount += todayAppointments;
        }

        if (newUsers > 0) {
            notifications.push({
                type: 'new_user',
                message: `${newUsers} nov${newUsers === 1 ? 'i' : 'ih'} korisnik${newUsers === 1 ? '' : 'a'}`,
                count: newUsers,
                priority: 'info',
                icon: '👤'
            });
            unreadCount += newUsers;
        }

        if (incompleteAppointments > 0) {
            notifications.push({
                type: 'incomplete',
                message: `${incompleteAppointments} nedovršen${incompleteAppointments === 1 ? 'i' : 'ih'} termin${incompleteAppointments === 1 ? '' : 'a'}`,
                count: incompleteAppointments,
                priority: 'error',
                icon: '⚠️'
            });
            unreadCount += incompleteAppointments;
        }

        return NextResponse.json({
            notifications,
            unreadCount,
            summary: {
                newAppointments,
                todayAppointments,
                newUsers,
                incompleteAppointments
            }
        });
    } catch (err) {
        console.error("❌ Notifications error:", err);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

