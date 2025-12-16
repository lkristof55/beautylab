import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkOwnerAdminOrModerator } from "@/lib/auth";
import { SERVICES_CONFIG } from "@/lib/services";

// PUT - promjena dodijeljenog zaposlenika
export async function PUT(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Neautoriziran pristup" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const authCheck = await checkOwnerAdminOrModerator(token);
        if (!authCheck) {
            return NextResponse.json({ error: "Nemate dozvolu za ovu akciju" }, { status: 403 });
        }

        const { appointmentId, employeeId } = await req.json();

        if (!appointmentId) {
            return NextResponse.json({ error: "ID termina je obavezan" }, { status: 400 });
        }

        // Provjeri da termin postoji
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Termin nije pronađen" }, { status: 404 });
        }

        // Provjeri da zaposlenik postoji (ako je naveden)
        if (employeeId) {
            const employee = await prisma.employee.findUnique({
                where: { id: employeeId },
            });

            if (!employee || !employee.isActive) {
                return NextResponse.json({ error: "Zaposlenik nije pronađen ili nije aktivan" }, { status: 404 });
            }

            // Provjeri da zaposlenik nema drugi termin u tom vremenskom slotu
            const appointmentDate = new Date(appointment.date);
            const serviceConfig = SERVICES_CONFIG[appointment.service];
            const appointmentEnd = new Date(appointmentDate.getTime() + (serviceConfig?.duration || 60) * 60000);

            const conflictingAppointment = await prisma.appointment.findFirst({
                where: {
                    assignedEmployeeId: employeeId,
                    id: { not: appointmentId },
                    date: {
                        lt: appointmentEnd,
                    },
                    AND: {
                        date: {
                            gte: appointmentDate,
                        },
                    },
                },
            });

            if (conflictingAppointment) {
                return NextResponse.json(
                    { error: "Zaposlenik već ima termin u tom vremenskom slotu" },
                    { status: 409 }
                );
            }
        }

        // Ažuriraj termin
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                assignedEmployeeId: employeeId || null,
            },
            include: {
                assignedEmployee: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json({
            appointment: updatedAppointment,
            message: "Dodjela zaposlenika uspješno ažurirana"
        });
    } catch (error) {
        console.error("PUT /admin/appointments/assign error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

