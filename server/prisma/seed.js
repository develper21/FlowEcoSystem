const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

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

    console.log('✅ Users created');

    const stages = [
        { name: 'Engineering Review', order: 1, requiresApproval: true },
        { name: 'Cost Impact Analysis', order: 2, requiresApproval: true },
        { name: 'Supply Chain Check', order: 3, requiresApproval: true },
        { name: 'Final Approval', order: 4, requiresApproval: true, isFinal: true },
    ];

    for (const stage of stages) {
        await prisma.approvalStage.upsert({
            where: { name: stage.name },
            update: {},
            create: stage,
        });
    }
    console.log('✅ Approval Stages created');

    const productA = await prisma.product.create({
        data: {
            name: 'Solar Generator X1000',
            status: 'ACTIVE',
            versions: {
                create: {
                    version: 'v1.0',
                    salePrice: 999.99,
                    costPrice: 450.00,
                    status: 'ACTIVE',
                },
            },
        },
    });

    const versionA = await prisma.productVersion.findFirst({ where: { productId: productA.id } });
    if (versionA) {
        await prisma.product.update({
            where: { id: productA.id },
            data: { currentVersionId: versionA.id }
        });
    }

    console.log('✅ Products created');

    if (versionA) {
        await prisma.eCO.create({
            data: {
                title: 'Upgrade Battery Capacity',
                type: 'PRODUCT',
                productId: productA.id,
                createdBy: engineer.id,
                status: 'IN_PROGRESS',
                currentStage: 'Engineering Review',
                versionUpdate: true,
            },
        });
    }

    console.log('✅ ECOs created');

    // Create historical ECOs for chart visualization
    const statuses = ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'DRAFT'];
    const types = ['PRODUCT', 'BOM', 'PROCESS'];

    console.log('🌱 Generating historical data...');
    for (let i = 0; i < 20; i++) {
        const daysAgo = Math.floor(Math.random() * 10);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        await prisma.eCO.create({
            data: {
                title: `Legacy ECO #${1000 + i}`,
                type: types[Math.floor(Math.random() * types.length)],
                productId: productA.id,
                createdBy: engineer.id,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                currentStage: 'Final Approval',
                createdAt: date,
                updatedAt: date
            }
        });
    }
    console.log('✅ Historical data generated');
    console.log('🌱 Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
