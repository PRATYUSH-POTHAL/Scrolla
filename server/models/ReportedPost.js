import mongoose from 'mongoose';

const reportedPostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    reason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

reportedPostSchema.index({ user: 1, post: 1 }, { unique: true });
reportedPostSchema.index({ post: 1 });

const ReportedPost = mongoose.model('ReportedPost', reportedPostSchema);

export default ReportedPost;
