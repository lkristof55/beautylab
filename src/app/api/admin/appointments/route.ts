import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Helper funkcija za provjeru admina
async function checkAdmin(token: string) {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    const adminEmail = "irena@beautylab.hr";
    if (!user || (!user.isAdmin && user.email !== adminEmail)) {
        return null;
    }
    return decoded;
}

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const admin = await checkAdmin(token);
        if (!admin) {
            return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 });
        }

        const appointments = await prisma.appointment.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { date: "asc" },
        });

        return NextResponse.json(appointments);
    } catch (err) {
        console.error("❌ Admin appointments error:", err);
        return NextResponse.json({ error: "Greška pri dohvaćanju termina" }, { status: 500 });
    }
}

// PUT - ažuriraj termin
export async function PUT(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const admin = await checkAdmin(token);
        if (!admin) {
            return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 });
        }

        const { appointmentId, date, service } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ error: "ID termina je obavezan" }, { status: 400 });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Termin nije pronađen" }, { status: 404 });
        }

        const updateData: { date?: Date; service?: string } = {};
        if (date) {
            const newDate = new Date(date);
            const now = new Date();
            if (newDate < now) {
                return NextResponse.json(
                    { error: "Ne možete postaviti termin u prošlosti" },
                    { status: 400 }
                );
            }
            updateData.date = newDate;
        }
        if (service) {
            updateData.service = service;
        }

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: updateData,
            include: { user: { select: { name: true, email: true } } },
        });

        return NextResponse.json({
            appointment: updated,
            message: "Termin uspješno ažuriran",
        });
    } catch (err) {
        console.error("❌ Update appointment error:", err);
        return NextResponse.json({ error: "Greška pri ažuriranju termina" }, { status: 500 });
    }
}

// POST - kreiraj novi termin (admin)
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const admin = await checkAdmin(token);
        if (!admin) {
            return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 });
        }

        const { date, service, duration, userId, unregisteredUser } = await req.json();

        console.log("Received data:", { date, service, duration, userId, unregisteredUser });

        if (!date || !service) {
            return NextResponse.json({ error: "Datum i usluga su obavezni" }, { status: 400 });
        }

        // Provjera korisnika - mora biti ili userId ili unregisteredUser
        const hasUserId = userId && userId !== "";
        const hasUnregisteredUser = unregisteredUser && unregisteredUser.name && unregisteredUser.phone;

        if (!hasUserId && !hasUnregisteredUser) {
            return NextResponse.json({ error: "Morate odabrati korisnika ili unijeti podatke neregistriranog korisnika" }, { status: 400 });
        }

        if (unregisteredUser && (!unregisteredUser.name || !unregisteredUser.phone)) {
            return NextResponse.json({ error: "Ime i kontakt broj su obavezni za neregistriranog korisnika" }, { status: 400 });
        }

        const appointmentDate = new Date(date);
        const now = new Date();

        // Provjera da termin nije u prošlosti
        if (appointmentDate < now) {
            return NextResponse.json({ error: "Termin ne može biti u prošlosti." }, { status: 400 });
        }

        // Provjera radnog vremena (9:00 - 19:00)
        const startHour = appointmentDate.getHours();
        const startMinute = appointmentDate.getMinutes();
        if (startHour < 9 || startHour >= 19 || (startHour === 19 && startMinute > 0)) {
            return NextResponse.json({ error: "Termini se mogu rezervirati samo između 9:00 i 19:00." }, { status: 400 });
        }

        // Provjera preklapanja termina
        const serviceDuration = duration || 60;
        const appointmentEnd = new Date(appointmentDate.getTime() + serviceDuration * 60000);

        const overlappingAppointment = await prisma.appointment.findFirst({
            where: {
                date: {
                    lt: appointmentEnd,
                },
                AND: {
                    date: {
                        gt: new Date(appointmentDate.getTime() - serviceDuration * 60000),
                    },
                },
            },
        });

        if (overlappingAppointment) {
            return NextResponse.json({ error: "Odabrani termin se preklapa s postojećim terminom." }, { status: 400 });
        }

        const appointmentData: any = {
            date: appointmentDate,
            service,
        };

        if (userId) {
            appointmentData.userId = userId;
        } else {
            appointmentData.userId = null;
        }

        if (unregisteredUser) {
            appointmentData.unregisteredName = unregisteredUser.name;
            appointmentData.unregisteredPhone = unregisteredUser.phone;
        }

        const appointment = await prisma.appointment.create({
            data: appointmentData,
            include: { user: { select: { name: true, email: true } } },
        });

        return NextResponse.json({ appointment, message: "Termin uspješno kreiran" });
    } catch (err: any) {
        console.error("❌ Create appointment error:", err);
        console.error("Error details:", JSON.stringify(err, null, 2));
        return NextResponse.json({ 
            error: err.message || "Greška pri kreiranju termina",
            details: process.env.NODE_ENV === "development" ? err.message : undefined
        }, { status: 500 });
    }
}

// DELETE - obriši termin
export async function DELETE(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const admin = await checkAdmin(token);
        if (!admin) {
            return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 });
        }

        const { appointmentId } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ error: "ID termina je obavezan" }, { status: 400 });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Termin nije pronađen" }, { status: 404 });
        }

        await prisma.appointment.delete({
            where: { id: appointmentId },
        });

        return NextResponse.json({ message: "Termin uspješno obrisan" });
    } catch (err) {
        console.error("❌ Delete appointment error:", err);
        return NextResponse.json({ error: "Greška pri brisanju termina" }, { status: 500 });
    }
}
