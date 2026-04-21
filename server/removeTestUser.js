/**
 * removeTestUser.js
 * Run once: node removeTestUser.js
 * Deletes the "testuser" account and ALL associated data from MongoDB.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Follow from './models/Follow.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';
import Like from './models/Like.js';
import JourneyMember from './models/JourneyMember.js';
import JourneyHistory from './models/JourneyHistory.js';
import MoodLog from './models/MoodLog.js';
import Notification from './models/Notification.js';

const USERNAME = process.argv[2];
if (!USERNAME) {
  console.error('Usage: node removeTestUser.js <username>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const user = await User.findOne({ username: USERNAME });
  if (!user) {
    console.log(`ℹ️  No user found with username "${USERNAME}". Nothing to remove.`);
    await mongoose.disconnect();
    return;
  }

  const uid = user._id;
  console.log(`🗑  Found testuser: ${uid} — removing all associated data...`);

  const [
    followsRemoved,
    postsRemoved,
    commentsRemoved,
    likesRemoved,
    membersRemoved,
    historyRemoved,
    moodsRemoved,
    notifsRemoved
  ] = await Promise.all([
    Follow.deleteMany({ $or: [{ follower: uid }, { followee: uid }] }),
    Post.deleteMany({ author: uid }),
    Comment.deleteMany({ author: uid }),
    Like.deleteMany({ user: uid }),
    JourneyMember.deleteMany({ user: uid }),
    JourneyHistory.deleteMany({ user: uid }),
    MoodLog.deleteMany({ user: uid }),
    Notification.deleteMany({ $or: [{ recipient: uid }, { sender: uid }] })
  ]);

  console.log(`   Follows:           ${followsRemoved.deletedCount}`);
  console.log(`   Posts:             ${postsRemoved.deletedCount}`);
  console.log(`   Comments:          ${commentsRemoved.deletedCount}`);
  console.log(`   Likes:             ${likesRemoved.deletedCount}`);
  console.log(`   Journey members:   ${membersRemoved.deletedCount}`);
  console.log(`   Journey history:   ${historyRemoved.deletedCount}`);
  console.log(`   Mood logs:         ${moodsRemoved.deletedCount}`);
  console.log(`   Notifications:     ${notifsRemoved.deletedCount}`);

  await User.deleteOne({ _id: uid });
  console.log(`✅ User "${USERNAME}" deleted from DB.`);

  await mongoose.disconnect();
  console.log('Disconnected.');
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
