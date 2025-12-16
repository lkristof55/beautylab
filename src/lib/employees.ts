import prisma from "./prisma";

/**
 * Pronađi dostupnog zaposlenika za određenu uslugu i termin
 */
export async function findAvailableEmployee(
  service: string,
  appointmentDate: Date,
  appointmentEnd: Date
): Promise<string | null> {
  // Pronađi sve aktivne zaposlenike
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
  });

  if (employees.length === 0) {
    return null;
  }

  // Pronađi zaposlenike koji nemaju termin u tom vremenskom slotu
  for (const employee of employees) {
    // Provjeri sve termine zaposlenika u blizini (4h prije i poslije)
    const employeeAppointments = await prisma.appointment.findMany({
      where: {
        assignedEmployeeId: employee.id,
        date: {
          gte: new Date(appointmentDate.getTime() - 4 * 60 * 60 * 1000), // 4h unazad
          lte: new Date(appointmentEnd.getTime() + 4 * 60 * 60 * 1000), // 4h naprijed
        },
      },
    });

    // Provjeri preklapanje - pretpostavljamo prosječnu duljinu termina od 60 minuta
    let hasConflict = false;
    for (const existing of employeeAppointments) {
      const existingStart = new Date(existing.date);
      const existingEnd = new Date(existingStart.getTime() + 60 * 60000); // 60 minuta

      // Provjeri preklapanje
      if (
        (appointmentDate >= existingStart && appointmentDate < existingEnd) ||
        (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
        (appointmentDate <= existingStart && appointmentEnd >= existingEnd)
      ) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      return employee.id;
    }
  }

  // Ako nema dostupnih, vrati prvog zaposlenika (možda treba bolja logika)
  return employees[0]?.id || null;
}

/**
 * Provjeri koliko termina iste usluge već postoji u određenom vremenskom slotu
 */
export async function countConcurrentAppointments(
  service: string,
  appointmentDate: Date,
  appointmentEnd: Date,
  excludeAppointmentId?: string
): Promise<number> {
  const where: any = {
    service,
    date: {
      lt: appointmentEnd,
    },
    AND: {
      date: {
        gte: appointmentDate,
      },
    },
  };

  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  const count = await prisma.appointment.count({ where });
  return count;
}


