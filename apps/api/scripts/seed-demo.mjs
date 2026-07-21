/**
 * Seeds the three fixed demo accounts used by the one-click "Pitch shortcuts"
 * (task #18): an ADMIN (SUPER), a FOUNDER with a completed profile, and an
 * INVESTOR with a completed profile.
 *
 * Idempotent — re-running updates the profiles rather than creating duplicates.
 * Passwords are random and never printed: these accounts are reached through
 * POST /auth/demo-login, not by typing credentials.
 *
 * Usage (from apps/api, after `npm run build` so dist/ exists):
 *   DATABASE_URL=... npm run seed:demo
 */
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEMO_ACCOUNTS, DEMO_SEED } from '../dist/auth/demo-accounts.js';

const prisma = new PrismaClient();

async function upsertUser(email, role) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(randomBytes(24).toString('hex'), 10),
      role,
      status: 'ACTIVE',
      // Seeded out-of-band, so there is no OTP round-trip.
      emailVerified: true,
      mobileVerified: true,
    },
  });
}

async function main() {
  // Admin
  const admin = await upsertUser(DEMO_ACCOUNTS.ADMIN.email, 'ADMIN');
  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, adminRole: DEMO_SEED.adminRole },
    update: { adminRole: DEMO_SEED.adminRole },
  });

  // Founder + completed company profile
  const founder = await upsertUser(DEMO_ACCOUNTS.FOUNDER.email, 'FOUNDER');
  await prisma.founderProfile.upsert({
    where: { userId: founder.id },
    create: { userId: founder.id, ...DEMO_SEED.founderProfile },
    update: { ...DEMO_SEED.founderProfile },
  });

  // Investor + completed fund profile
  const investor = await upsertUser(DEMO_ACCOUNTS.INVESTOR.email, 'INVESTOR');
  await prisma.investorProfile.upsert({
    where: { userId: investor.id },
    create: { userId: investor.id, ...DEMO_SEED.investorProfile },
    update: { ...DEMO_SEED.investorProfile },
  });

  console.log('Seeded demo accounts:');
  for (const [key, acc] of Object.entries(DEMO_ACCOUNTS)) {
    console.log(`  ${key.padEnd(9)} ${acc.email}  (${acc.label})`);
  }
}

main()
  .catch((e) => {
    console.error('seed-demo failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
