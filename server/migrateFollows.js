import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Follow from './models/Follow.js';

dotenv.config();

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
};

const migrateFollows = async () => {
    await connectDB();

    // Get all users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
        if (!user.following || user.following.length === 0) {
            skippedCount++;
            continue;
        }

        for (const followeeId of user.following) {
            try {
                // Ensure unique follow records
                await Follow.updateOne(
                    { follower: user._id, followee: followeeId },
                    { $setOnInsert: { follower: user._id, followee: followeeId } },
                    { upsert: true }
                );
            } catch (err) {
                console.error(`Error migrating follow ${user._id} -> ${followeeId}:`, err);
            }
        }
        migratedCount++;
        console.log(`  Migrated user ${user._id} (${user.following.length} following)`);
    }

    console.log(`\n✅ Follow Migration complete!`);
    console.log(`   Users with follows migrated: ${migratedCount}`);
    console.log(`   Users skipped (no following): ${skippedCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
};

migrateFollows().catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
});
