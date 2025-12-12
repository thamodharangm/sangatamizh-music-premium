const prisma = require('../config/prisma');

// Serialize Helper for BigInt
const serialize = (data) => JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
));

// Toggle Like (Like/Unlike)
exports.toggleLike = async (req, res) => {
    try {
        const { userId, songId } = req.body;

        if (!userId || !songId) {
            return res.status(400).json({ error: "Missing userId or songId" });
        }

        // Check if song exists
        const song = await prisma.song.findUnique({
            where: { id: songId }
        });

        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        // Check if already liked
        const existingLike = await prisma.$queryRawUnsafe(
            `SELECT * FROM "Like" WHERE "userId" = $1 AND "songId" = $2 LIMIT 1`,
            userId,
            songId
        );

        if (existingLike && existingLike.length > 0) {
            // Unlike - delete the like
            await prisma.$executeRawUnsafe(
                `DELETE FROM "Like" WHERE "userId" = $1 AND "songId" = $2`,
                userId,
                songId
            );
            return res.json({ status: 'unliked' });
        } else {
            // Like - insert new like
            await prisma.$executeRawUnsafe(
                `INSERT INTO "Like" ("id", "userId", "songId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())`,
                userId,
                songId
            );
            return res.json({ status: 'liked' });
        }

    } catch (e) {
        console.error("Like Toggle Error:", e);
        res.status(500).json({ error: e.message });
    }
};

// Get User's Liked Song IDs (for fast frontend checking)
exports.getLikedIds = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const likes = await prisma.$queryRawUnsafe(
            `SELECT "songId" FROM "Like" WHERE "userId" = $1`,
            userId
        );

        const ids = likes.map(l => l.songId);
        res.json(ids);

    } catch (e) {
        console.error("Failed to fetch like IDs:", e);
        res.status(500).json({ error: e.message });
    }
};

// Get User's Liked Songs (Full Objects for Playlist Page)
exports.getLikedSongs = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const songs = await prisma.$queryRawUnsafe(
            `SELECT s.* FROM songs s INNER JOIN "Like" l ON s.id = l."songId" WHERE l."userId" = $1 ORDER BY l."createdAt" DESC`,
            userId
        );

        res.json(serialize(songs));

    } catch (e) {
        console.error("Failed to fetch liked songs:", e);
        res.status(500).json({ error: e.message });
    }
};
