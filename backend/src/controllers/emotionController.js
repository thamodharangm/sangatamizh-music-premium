const prisma = require('../config/prisma');

/**
 * Initialize emotions for all existing songs
 * Sets default 'Feel Good' for songs without emotions
 */
const initializeEmotions = async (req, res) => {
    try {
        // Update all songs with NULL, empty, or 'Neutral' emotion
        const result = await prisma.song.updateMany({
            where: {
                OR: [
                    { emotion: null },
                    { emotion: '' },
                    { emotion: 'Neutral' }
                ]
            },
            data: {
                emotion: 'Feel Good'
            }
        });

        res.json({
            success: true,
            message: `Updated ${result.count} songs with default emotion`,
            updatedCount: result.count
        });
    } catch (error) {
        console.error('Error initializing emotions:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get emotion statistics
 */
const getEmotionStats = async (req, res) => {
    try {
        const songs = await prisma.song.findMany({
            select: { emotion: true }
        });

        const stats = {};
        songs.forEach(song => {
            const emotion = song.emotion || 'No emotion';
            stats[emotion] = (stats[emotion] || 0) + 1;
        });

        res.json({
            total: songs.length,
            distribution: stats
        });
    } catch (error) {
        console.error('Error getting emotion stats:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Bulk update song emotions
 */
const bulkUpdateEmotions = async (req, res) => {
    try {
        const { updates } = req.body; // Array of { id, emotion }
        
        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'Updates must be an array' });
        }

        const results = await Promise.all(
            updates.map(({ id, emotion }) =>
                prisma.song.update({
                    where: { id },
                    data: { emotion }
                })
            )
        );

        res.json({
            success: true,
            updated: results.length
        });
    } catch (error) {
        console.error('Error bulk updating emotions:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    initializeEmotions,
    getEmotionStats,
    bulkUpdateEmotions
};
