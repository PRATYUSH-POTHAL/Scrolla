/**
 * One-time migration script to convert legacy image formats in posts.
 * 
 * Old format: plain string URLs (e.g., "https://res.cloudinary.com/...")
 * New format: { url, publicId, filter: 'none', aspectRatio: 'original' }
 * 
 * Run: node migrateImages.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
};

const extractPublicId = (url) => {
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        const pathAfterUpload = parts[1];
        const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
        return withoutVersion.replace(/\.[^.]+$/, '');
    } catch {
        return null;
    }
};

const migrateImages = async () => {
    await connectDB();

    // Get all posts (no model import needed — use raw collection)
    const posts = await mongoose.connection.db.collection('posts').find({}).toArray();

    let migratedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
        if (!post.images || post.images.length === 0) {
            skippedCount++;
            continue;
        }

        let needsUpdate = false;
        const newImages = post.images.map(image => {
            // Already in new format
            if (typeof image === 'object' && image.url) {
                // Ensure publicId exists
                if (!image.publicId && image.url) {
                    image.publicId = extractPublicId(image.url);
                    needsUpdate = true;
                }
                return image;
            }

            // Old format: plain string URL
            if (typeof image === 'string') {
                needsUpdate = true;
                return {
                    url: image,
                    publicId: extractPublicId(image),
                    filter: 'none',
                    aspectRatio: 'original'
                };
            }

            return image;
        });

        if (needsUpdate) {
            await mongoose.connection.db.collection('posts').updateOne(
                { _id: post._id },
                { $set: { images: newImages } }
            );
            migratedCount++;
            console.log(`  Migrated post ${post._id} (${newImages.length} images)`);
        } else {
            skippedCount++;
        }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migratedCount} posts`);
    console.log(`   Skipped: ${skippedCount} posts (already up to date or no images)`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
};

migrateImages().catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
});
