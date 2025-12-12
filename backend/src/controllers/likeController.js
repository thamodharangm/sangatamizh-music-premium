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

        // Check if Liked
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_songId: { userId, songId }
            }
        });

        if (existingLike) {
            // Unlike
            await prisma.like.delete({
                where: { id: existingLike.id }
            });
            return res.json({ status: 'unliked' });
        } else {
            // Like
            await prisma.like.create({
                data: { userId, songId }
            });
            return res.json({ status: 'liked' });
        }

    } catch (e) {
        console.error("Link Toggle Error:", e);
        res.status(500).json({ error: e.message });
    }
};

// Get User's Liked Song IDs (for fast frontend checking)
exports.getLikedIds = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const likes = await prisma.like.findMany({
            where: { userId },
            select: { songId: true }
        });

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

        const likes = await prisma.like.findMany({
            where: { userId },
            include: { song: true },
            orderBy: { createdAt: 'desc' }
        });

        const songs = likes.map(l => l.song);
        res.json(serialize(songs));

    } catch (e) {
        console.error("Failed to fetch liked songs:", e);
        res.status(500).json({ error: e.message });
    }
};
