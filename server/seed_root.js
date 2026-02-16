const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    try {
        const password = await bcrypt.hash('password123', 10);

        const admin = await prisma.user.upsert({
            where: { email: 'admin@ecoflow.com' },
            update: {},
            create: {
                email: 'admin@ecoflow.com',
                name: 'Admin User',
                password,
                roles: ['ADMIN'],
                status: 'ACTIVE',
            },
        });
        console.log('✅ Admin user created');

        const engineer = await prisma.user.upsert({
            where: { email: 'engineer@ecoflow.com' },
            update: {},
            create: {
                email: 'engineer@ecoflow.com',
                name: 'Jane Engineer',
                password,
                roles: ['ENGINEERING'],
                status: 'ACTIVE',
            },
        });
        console.log('✅ Engineer user created');

    } catch (e) {
        console.error('Error creating users:', e);
    }

    console.log('🌱 Seed attempt finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
