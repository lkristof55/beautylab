import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkOwnerAdminOrModerator } from "@/lib/auth";
import { countConcurrentAppointments } from "@/lib/employees";
import { SERVICES_CONFIG } from "@/lib/services";

// PUT - ažuriranje termina (datum, vrijeme, usluga, zaposlenik)
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

        const { appointmentId, date, service, assignedEmployeeId } = await req.json();

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

        const updateData: any = {};

        // Ažuriraj datum ako je naveden
        if (date) {
            const appointmentDate = new Date(date);
            const now = new Date();

            if (appointmentDate < now) {
                return NextResponse.json(
                    { error: "Ne možete postaviti termin u prošlosti" },
                    { status: 400 }
                );
            }

            const hour = appointmentDate.getHours();
            if (hour < 9 || hour >= 19) {
                return NextResponse.json(
                    { error: "Radno vrijeme je od 9:00 do 19:00" },
                    { status: 400 }
                );
            }

            updateData.date = appointmentDate;
        }

        // Ažuriraj uslugu ako je navedena
        if (service) {
            updateData.service = service;
        }

        // Provjeri maxConcurrent ako se mijenja datum ili usluga
        if (updateData.date || updateData.service) {
            const finalDate = updateData.date ? new Date(updateData.date) : new Date(appointment.date);
            const finalService = updateData.service || appointment.service;

            const serviceConfig = SERVICES_CONFIG[finalService];
            const appointmentDuration = serviceConfig?.duration || 60;
            const appointmentEnd = new Date(finalDate.getTime() + appointmentDuration * 60000);

            const concurrentCount = await countConcurrentAppointments(
                finalService,
                finalDate,
                appointmentEnd,
                appointmentId
            );

            if (concurrentCount >= (serviceConfig?.maxConcurrent || 1)) {
                return NextResponse.json(
                    {
                        error: `Maksimalan broj istovremenih rezervacija za uslugu "${finalService}" je ${serviceConfig?.maxConcurrent || 1}. Već postoji ${concurrentCount} rezervacija u tom vremenskom slotu.`,
                    },
                    { status: 409 }
                );
            }
        }

        // Ažuriraj zaposlenika ako je naveden
        if (assignedEmployeeId !== undefined) {
            if (assignedEmployeeId) {
                const employee = await prisma.employee.findUnique({
                    where: { id: assignedEmployeeId },
                });

                if (!employee || !employee.isActive) {
                    return NextResponse.json(
                        { error: "Zaposlenik nije pronađen ili nije aktivan" },
                        { status: 404 }
                    );
                }

                // Provjeri da zaposlenik nema drugi termin u tom vremenskom slotu
                const appointmentDate = updateData.date ? new Date(updateData.date) : new Date(appointment.date);
                const finalService = updateData.service || appointment.service;
                const serviceConfig = SERVICES_CONFIG[finalService];
                const appointmentEnd = new Date(appointmentDate.getTime() + (serviceConfig?.duration || 60) * 60000);

                const conflictingAppointment = await prisma.appointment.findFirst({
                    where: {
                        assignedEmployeeId: assignedEmployeeId,
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

            updateData.assignedEmployeeId = assignedEmployeeId || null;
        }

        // Ažuriraj termin
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: updateData,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                assignedEmployee: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json({
            appointment: updatedAppointment,
            message: "Termin uspješno ažuriran"
        });
    } catch (error) {
        console.error("PUT /admin/appointments/update error:", error);
        return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
    }
}

