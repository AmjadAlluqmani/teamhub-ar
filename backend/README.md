# TeamHub Backend (Express + Prisma + SQLite)
## Quick start
1) `cp .env.example .env`
2) `npm install`
3) `npx prisma generate && npx prisma migrate dev --name init`
4) `npm run seed`
5) `npm run dev` -> http://localhost:4000

### Test login (seeded)
- amjad@example.com / admin123 (admin)
- retaj@example.com / admin123 (moderator)
- raghad@example.com / admin123 (moderator)
- raneem@example.com / admin123 (moderator)
