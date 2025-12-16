import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Kreiraj zaposlenike
  const nina = await prisma.employee.upsert({
    where: { email: 'nina@beautylab.hr' },
    update: {},
    create: {
      name: 'Nina',
      email: 'nina@beautylab.hr',
      phone: '+385 99 123 4567',
      isActive: true,
    },
  });

  const gabriela = await prisma.employee.upsert({
    where: { email: 'gabriela@beautylab.hr' },
    update: {},
    create: {
      name: 'Gabriela',
      email: 'gabriela@beautylab.hr',
      phone: '+385 99 765 4321',
      isActive: true,
    },
  });

  // Ažuriraj Irenu da bude OWNER ako već postoji
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'irena@beautylab.hr' },
    update: {
      role: 'OWNER',
    },
    create: {
      name: 'Irena',
      email: 'irena@beautylab.hr',
      password: hashedPassword,
      role: 'OWNER',
    },
  });

  console.log('Seed podaci kreirani:', { nina, gabriela });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





