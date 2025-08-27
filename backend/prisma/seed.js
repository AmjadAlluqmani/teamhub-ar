import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // كلمة مرور موحدة للتجربة
  const pwd = await bcrypt.hash("admin123", 10);

  // المستخدمين الأربعة
  const amjad = await prisma.user.upsert({
    where: { email: "amjad@example.com" },
    update: {},
    create: {
      name: "أمجاد الشمري",
      email: "amjad@example.com",
      password: pwd,
      role: "admin", // نص بدل enum
      avatarUrl: null,
    },
  });

  const retaj = await prisma.user.upsert({
    where: { email: "retaj@example.com" },
    update: {},
    create: {
      name: "ريتاچ",
      email: "retaj@example.com",
      password: pwd,
      role: "moderator",
    },
  });

  const raghad = await prisma.user.upsert({
    where: { email: "raghad@example.com" },
    update: {},
    create: {
      name: "رغد",
      email: "raghad@example.com",
      password: pwd,
      role: "moderator",
    },
  });

  const raneem = await prisma.user.upsert({
    where: { email: "raneem@example.com" },
    update: {},
    create: {
      name: "رنيم",
      email: "raneem@example.com",
      password: pwd,
      role: "moderator",
    },
  });

  // مشروع تجريبي
  const project = await prisma.project.upsert({
    where: { slug: "mobile-app" },
    update: {},
    create: {
      slug: "mobile-app",
      title: "تطبيق الجوال التفاعلي",
      description: "تطبيق جوال بواجهة عربية جميلة وتجربة متقدمة.",
      visibility: "group_public",
      ownerId: amjad.id,
      tags: "UI/UX,Mobile",
      techStack: "React Native,TypeScript",
      coverImage: null,
      coverVideo: null,
      members: {
        create: [
          { userId: amjad.id, roleInProject: "owner", addedBy: amjad.id },
          { userId: retaj.id, roleInProject: "member", addedBy: amjad.id },
          { userId: raghad.id, roleInProject: "member", addedBy: amjad.id },
          { userId: raneem.id, roleInProject: "member", addedBy: amjad.id },
        ],
      },
    },
  });

  // رسالة ترحيب
  await prisma.message.create({
    data: {
      projectId: project.id,
      channel: "general",
      body: "مرحبًا بالفريق! هذا مشروع تجريبي.",
      attachments: null,
      authorId: amjad.id,
    },
  });

  console.log("✅ Seed completed.");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
