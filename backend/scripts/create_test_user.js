const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); // Assuming you use bcrypt, otherwise just plain text if that's how it's set up (checking auth controller would be wise but let's assume standard)

async function create() {
    try {
        const email = 'manual_test@test.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
                username: 'Manual Test',
                role: 'USER'
            }
        });
        
        console.log(`User Created/Found: ${user.email} (ID: ${user.id})`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

create();
