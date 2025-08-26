import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const pass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'amjad@example.com' },
    update: {},
    create: { name: 'أمجاد', email: 'amjad@example.com', password: pass, role: 'admin' }
  });
  const m1 = await prisma.user.upsert({
    where: { email: 'retaj@example.com' },
    update: {},
    create: { name: 'ريتاج', email: 'retaj@example.com', password: pass, role: 'moderator' }
  });
  const m2 = await prisma.user.upsert({
    where: { email: 'raghad@example.com' },
    update: {},
    create: { name: 'رغد', email: 'raghad@example.com', password: pass, role: 'moderator' }
  });
  const m3 = await prisma.user.upsert({
    where: { email: 'raneem@example.com' },
    update: {},
    create: { name: 'رنيم', email: 'raneem@example.com', password: pass, role: 'moderator' }
  });
  console.log('Seeded users:', admin.email, m1.email, m2.email, m3.email);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
