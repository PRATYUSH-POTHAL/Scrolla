import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import MoodBadge from './MoodBadge';
import ThreeDotMenu from './ThreeDotMenu';
import CommentSection from './CommentSection';
import { formatDate } from '../utils/formatDate';
import { postService } from '../services/postService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Cloudinary filter map
const CLOUDINARY_FILTERS = {
    'none': '',
    'sepia': 'e_sepia',
    'grayscale': 'e_grayscale',
    'contrast': 'e_contrast:50',
    'brightness': 'e_brightness:30',
    'warmth': 'e_tint:40:red:yellow',
    'cool': 'e_tint:40:blue:cyan',
    'blur': 'e_blur:200',
    'vignette': 'e_vignette:50',
};

// CSS filter map for client-side preview
const CSS_FILTERS = {
    'none': 'none',
    'sepia': 'sepia(0.8)',
    'grayscale': 'grayscale(1)',
    'contrast': 'contrast(1.4)',
    'brightness': 'brightness(1.3)',
    'warmth': 'sepia(0.3) saturate(1.5)',
    'cool': 'saturate(0.8) hue-rotate(20deg)',
    'blur': 'blur(2px)',
    'vignette': 'none',
};

// Build Cloudinary URL with transformations
const buildCloudinaryUrl = (baseUrl, transformations) => {
    if (!baseUrl || !transformations || transformations.length === 0) return baseUrl;
    const uploadIndex = baseUrl.indexOf('/upload/');
    if (uploadIndex === -1) return baseUrl;
    const before = baseUrl.substring(0, uploadIndex + 8);
    const after = baseUrl.substring(uploadIndex + 8);
    const transformStr = transformations.filter(Boolean).join(',');
    return `${before}${transformStr}/${after}`;
};

// ─── Autoplay Video Component ───
const AutoplayVideo = ({ src, poster, aspectRatio, filterLabel }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        video.play().catch(() => {});
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(container);

        return () => {
            observer.disconnect();
            video.pause();
        };
    }, [src]);

    const toggleMute = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (video) {
            video.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const aspectMap = {
        '16:9': '16/9',
        '1:1': '1/1',
        '9:16': '9/16',
        '4:3': '4/3',
    };

    return (
        <div ref={containerRef} className="relative rounded-lg overflow-hidden" style={{ width: '100%', background: '#000' }}>
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                muted={isMuted}
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                className="w-full rounded-lg"
                style={{
                    aspectRatio: aspectMap[aspectRatio] || '16/9',
                    objectFit: 'contain',
                    maxHeight: '520px',
                    display: 'block',
                    background: '#000',
                }}
            />
            <button
                onClick={toggleMute}
                style={{
                    position: 'absolute', bottom: '12px', right: '12px',
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', color: 'white',
                    border: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                }}
            >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {filterLabel && (
                <div className="absolute top-2 left-2 flex gap-1">
                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">🎨 {filterLabel}</span>
                </div>
            )}
        </div>
    );
};

const PostCard = ({ post, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const shareUrl = `${window.location.origin}/posts/${post._id}`;
    const isOwnPost = user?._id === post.author?._id;

    if (!post.author) {
        console.error('Post author is null:', post);
        return null;
    }

    useEffect(() => {
        setLiked(post.likes?.includes(user?._id));
    }, [post.likes, user?._id]);

    // Check if current user follows this author
    useEffect(() => {
        if (post.author?.followers && user?._id) {
            const following = post.author.followers.some(f => {
                const fId = typeof f === 'object' ? (f._id || f) : f;
                return fId?.toString() === user._id?.toString();
            });
            setIsFollowing(following);
        }
    }, [post.author, user?._id]);

    const handleFollow = async (e) => {
        e.stopPropagation();
        if (followLoading) return;
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await userService.unfollowUser(post.author._id);
                setIsFollowing(false);
            } else {
                await userService.followUser(post.author._id);
                setIsFollowing(true);
            }
        } catch (err) {
            console.error('Follow/unfollow error:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleLike = async () => {
        try {
            const response = await postService.likePost(post._id);
            setLiked(response.liked);
            setLikeCount(response.likeCount);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleSave = async () => {
        try {
            await postService.savePost(post._id);
            alert('Post saved!');
        } catch (error) {
            console.error('Error saving post:', error);
        }
    };

    const handleHide = async () => {
        try {
            await postService.hidePost(post._id);
            alert('Post hidden!');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error hiding post:', error);
        }
    };

    const handleReport = async () => {
        try {
            await postService.reportPost(post._id);
            alert('Post reported. Thank you for helping keep Scrolla safe!');
        } catch (error) {
            console.error('Error reporting post:', error);
        }
    };

    const handleEdit = () => {
        navigate(`/edit-post/${post._id}`, { state: { post } });
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await postService.deletePost(post._id);
                alert('Post deleted!');
                if (onDelete) onDelete(post._id);
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    };

    // ─── Render image ───
    const renderImage = (image, index) => {
        const isStructured = typeof image === 'object' && image !== null;
        const url = isStructured ? image.url : image;
        const filter = isStructured ? image.filter : 'none';
        const aspectRatio = isStructured ? image.aspectRatio : 'original';
        const cssFilter = CSS_FILTERS[filter] || 'none';
        const aspectMap = { 'original': undefined, '1:1': '1/1', '16:9': '16/9', '4:3': '4/3', '9:16': '9/16' };

        return (
            <img
                key={index}
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full rounded-lg"
                loading="lazy"
                style={{
                    filter: cssFilter !== 'none' ? cssFilter : undefined,
                    aspectRatio: aspectMap[aspectRatio],
                    objectFit: aspectRatio !== 'original' ? 'contain' : undefined,
                    maxHeight: '520px',
                    background: aspectRatio !== 'original' ? '#000' : undefined,
                }}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'; }}
            />
        );
    };

    // ─── Render video ───
    const renderVideo = (video, index) => {
        const transforms = [];
        if (video.trimStart > 0) transforms.push(`so_${video.trimStart}`);
        if (video.trimEnd && video.trimEnd < video.duration) transforms.push(`eo_${video.trimEnd}`);
        if (video.muted) transforms.push('ac_none');
        if (video.aspectRatio && video.aspectRatio !== 'original') {
            transforms.push(`ar_${video.aspectRatio},c_fill`);
        }
        if (video.filter && video.filter !== 'none') {
            const cloudFilter = CLOUDINARY_FILTERS[video.filter];
            if (cloudFilter) transforms.push(cloudFilter);
        }
        transforms.push('q_auto', 'f_auto');
        const transformedUrl = buildCloudinaryUrl(video.url, transforms);

        const thumbTransforms = [];
        if (video.thumbnailTime > 0) thumbTransforms.push(`so_${video.thumbnailTime}`);
        thumbTransforms.push('q_auto', 'f_jpg');
        const thumbUrl = buildCloudinaryUrl(video.url, thumbTransforms);

        return (
            <AutoplayVideo
                key={index}
                src={transformedUrl}
                poster={thumbUrl}
                aspectRatio={video.aspectRatio || '16:9'}
                filterLabel={video.filter && video.filter !== 'none' ? video.filter : null}
            />
        );
    };

    return (
        <div className="card animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="cursor-pointer flex items-center gap-3"
                        onClick={() => navigate(`/profile/${post.author._id}`)}
                    >
                        <img
                            src={post.author.avatar}
                            alt={post.author.username}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                        />
                        <div>
                            <h3 className="font-semibold text-gray-800">{post.author.username}</h3>
                            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                        </div>
                    </div>

                    {/* Follow / Following button — hidden for own posts */}
                    {!isOwnPost && (
                        <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            style={{
                                padding: '4px 14px',
                                borderRadius: '6px',
                                border: isFollowing ? '1px solid #E4E0DA' : '1px solid #6B7F6E',
                                background: isFollowing ? '#FAFAF8' : '#6B7F6E',
                                color: isFollowing ? '#9A9590' : 'white',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: followLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: "'DM Sans', sans-serif",
                                whiteSpace: 'nowrap',
                                opacity: followLoading ? 0.6 : 1,
                                marginLeft: '4px',
                            }}
                        >
                            {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                        </button>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {showMenu && (
                        <ThreeDotMenu
                            isOwnPost={isOwnPost}
                            onSave={handleSave}
                            onHide={handleHide}
                            onReport={handleReport}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onClose={() => setShowMenu(false)}
                        />
                    )}
                </div>
            </div>

            {/* Mood Badge */}
            <div className="mb-3">
                <MoodBadge mood={post.mood} />
            </div>

            {/* Content */}
            <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

            {/* Images */}
            {post.images && post.images.length > 0 && (
                <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.images.map((image, index) => renderImage(image, index))}
                </div>
            )}

            {/* Videos */}
            {post.videos && post.videos.length > 0 && (
                <div className="space-y-3 mb-4">
                    {post.videos.map((video, index) => renderVideo(video, index))}
                </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.hashtags.map((tag, index) => (
                        <span key={index} className="text-blue-600 text-sm hover:underline cursor-pointer">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                <button
                    onClick={handleLike}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors group"
                >
                    {liked ? (
                        <FaHeart className="w-5 h-5 text-red-500" />
                    ) : (
                        <FaRegHeart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="font-medium">{likeCount}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{post.commentCount || 0}</span>
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="font-medium">Share</span>
                    </button>

                    {showShareMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl p-3 flex gap-2 z-10">
                            <FacebookShareButton url={shareUrl}>
                                <div className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">FB</div>
                            </FacebookShareButton>
                            <TwitterShareButton url={shareUrl}>
                                <div className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">TW</div>
                            </TwitterShareButton>
                            <WhatsappShareButton url={shareUrl}>
                                <div className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">WA</div>
                            </WhatsappShareButton>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <CommentSection postId={post._id} />
                </div>
            )}
        </div>
    );
};

export default PostCard;
