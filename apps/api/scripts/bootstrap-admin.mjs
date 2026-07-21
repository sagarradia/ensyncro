/**
 * One-time bootstrap of the first Super Admin (task #9).
 *
 * Admins are invite-only — there is no public admin signup (PRD §3). This
 * script creates the very first SUPER admin directly in the database; every
 * subsequent admin is created through the invite flow from inside the admin
 * panel (POST /api/admin/invites -> POST /api/auth/accept-invite).
 *
 * Usage (from apps/api):
 *   ADMIN_EMAIL=you@example.com npm run admin:bootstrap
 * The password is read from ADMIN_PASSWORD if set, otherwise prompted for, so
 * it never has to appear in a command line. DATABASE_URL must be set — see
 * DEPLOYMENT.md for getting the production connection string from Neon.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const PASSWORD_RULES = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const email = (arg('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('Provide an email: --email=you@example.com or ADMIN_EMAIL=...');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = createInterface({ input: stdin, output: stdout });
    password = await rl.question(`Password for ${email}: `);
    rl.close();
  }
  if (!PASSWORD_RULES.test(password ?? '')) {
    console.error('Password must be at least 8 characters and contain a letter and a number.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existingSuper = await prisma.adminProfile.findFirst({ where: { adminRole: 'SUPER' } });
    if (existingSuper && !process.argv.includes('--force')) {
      console.error(
        'A SUPER admin already exists. Use the invite flow to add more admins, ' +
          'or pass --force if you really mean to create another.',
      );
      process.exit(1);
    }
    if (await prisma.user.findUnique({ where: { email } })) {
      console.error(`A user with email ${email} already exists.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          // Bootstrapped out-of-band, so there is no OTP round-trip to do.
          emailVerified: true,
          mobileVerified: true,
        },
      });
      await tx.adminProfile.create({ data: { userId: u.id, adminRole: 'SUPER' } });
      return u;
    });

    console.log(`Created SUPER admin ${user.email} (id ${user.id}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('bootstrap-admin failed:', e.message);
  process.exit(1);
});
