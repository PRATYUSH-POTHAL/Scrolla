import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    followee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Prevent duplicate follows
followSchema.index({ follower: 1, followee: 1 }, { unique: true });
// Efficient lookups: "who do I follow?" and "who follows me?"
followSchema.index({ follower: 1 });
followSchema.index({ followee: 1 });

const Follow = mongoose.model('Follow', followSchema);

export default Follow;
