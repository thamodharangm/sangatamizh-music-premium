const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function systemCheck() {
    console.log("🚀 STARTING FINAL SYSTEM HEALTH CHECK...");
    let passed = true;

    // 1. Database Connection
    try {
        await prisma.$connect();
        console.log("✅ Database Connection: SOLID");
    } catch (e) {
        console.error("❌ Database Connection: FAILED", e.message);
        passed = false;
    }

    // 2. Schema Verification
    try {
        const userCount = await prisma.user.count();
        const songCount = await prisma.song.count();
        const historyCount = await prisma.playHistory.count();
        console.log(`✅ Schema Integrity: Verified`);
        console.log(`   - Users: ${userCount}`);
        console.log(`   - Songs: ${songCount}`);
        console.log(`   - History Records: ${historyCount}`);
    } catch (e) {
        console.error("❌ Schema Verification: FAILED", e.message);
        passed = false;
    }

    // 3. Logic Stress Test: Recently Played Query
    try {
        // Fetch a user ID to test with (or use a dummy)
        const user = await prisma.user.findFirst();
        if (user) {
            console.log(`ℹ️  Testing History Logic for User: ${user.email}`);
            const history = await prisma.playHistory.findMany({
                where: { userId: user.id },
                include: { song: true },
                orderBy: { playedAt: 'desc' },
                take: 100
            });
            console.log(`✅ History Query: SUCCESS (Retrieved ${history.length} records)`);
        } else {
            console.log("⚠️  Skipping History Logic Check: No users found.");
        }
    } catch (e) {
        console.error("❌ History Logic: CRASHED", e.message);
        passed = false;
    }

    console.log("---------------------------------------------------");
    if (passed) {
        console.log("🌟 FINAL VERDICT: SYSTEM READY FOR DEPLOYMENT 🌟");
    } else {
        console.log("⚠️  FINAL VERDICT: ISSUES DETECTED - DO NOT DEPLOY");
    }

    await prisma.$disconnect();
}

systemCheck();
