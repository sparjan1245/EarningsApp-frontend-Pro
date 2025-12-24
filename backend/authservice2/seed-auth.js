const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash('Superadmin123!', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'sadmin@admin.com' },
      update: {},
      create: {
        email: 'sadmin@admin.com',
        username: 'superadmin',
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        isVerified: true
      }
    });
    
    console.log('User seeded successfully:', user.email);
  } catch (error) {
    console.error('Error seeding user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed(); 