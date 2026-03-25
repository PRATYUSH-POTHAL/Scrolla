import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Edit, UserPlus, UserMinus, MessageSquare, Bell, 
    Home, Search, Map, Bookmark, User 
} from 'lucide-react';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');

    const isOwnProfile = currentUser?._id === id;

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const userData = await userService.getUser(id);
            setProfile(userData);
            setIsFollowing(userData.followers?.some(f => f._id === currentUser?._id));
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPosts = async () => {
        try {
            const userPosts = await postService.getUserPosts(id);
            setPosts(userPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await userService.unfollowUser(id);
                setIsFollowing(false);
                setProfile({
                    ...profile,
                    followerCount: profile.followerCount - 1
                });
            } else {
                await userService.followUser(id);
                setIsFollowing(true);
                setProfile({
                    ...profile,
                    followerCount: profile.followerCount + 1
                });
            }
        } catch (error) {
            console.error('Error following/unfollowing:', error);
            alert('Failed to update follow status');
        }
    };

    const handleEditProfile = () => {
        const newBio = prompt('Enter new bio:', profile.bio);
        if (newBio !== null) {
            updateProfile({ bio: newBio });
        }
    };

    const updateProfile = async (updates) => {
        try {
            const updated = await userService.updateUser(id, updates);
            setProfile(updated);
            // alert('Profile updated!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F1ED]">
                <LoadingSpinner message="Loading profile..." />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F1ED]">
                <div className="bg-white p-8 rounded-xl border border-[#E4E0DA] text-center max-w-md w-full">
                    <p className="text-[#2C2B28] font-medium mb-4">Profile not found</p>
                    <button onClick={() => navigate('/feed')} className="prof-btn-primary w-full">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-wrapper">
            
            {/* NAV */}
            <nav className="prof-nav">
                <Link to="/feed" className="prof-logo">Scrolla</Link>
                <div className="prof-nav-end">
                    <button className="prof-icon-btn"><MessageSquare className="w-[18px] h-[18px]" /></button>
                    <button className="prof-icon-btn">
                        <Bell className="w-[18px] h-[18px]" />
                        <div className="prof-notif-dot"></div>
                    </button>
                    <div className="prof-nav-divider"></div>
                    <button 
                        className="prof-avatar-sm" 
                        onClick={() => navigate(`/profile/${currentUser?._id}`)}
                        title="Go to my profile"
                    >
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="Me" />
                        ) : (
                            currentUser?.username?.[0]?.toUpperCase() || 'U'
                        )}
                    </button>
                    <button onClick={handleLogout} className="ml-2 text-xs text-red-500 hover:underline">Logout</button>
                </div>
            </nav>

            <div className="prof-layout">
                {/* SIDEBAR */}
                <aside className="prof-sidebar">
                    <Link to="/feed" className="prof-nav-link">
                        <Home className="w-[16px] h-[16px]" /> Home
                    </Link>
                    <Link to="#" className="prof-nav-link">
                        <Search className="w-[16px] h-[16px]" /> Explore
                    </Link>
                    <Link to="#" className="prof-nav-link">
                        <Map className="w-[16px] h-[16px]" /> Journeys
                    </Link>
                    <Link to="#" className="prof-nav-link">
                        <Bookmark className="w-[16px] h-[16px]" /> Saved
                    </Link>
                    <Link to={`/profile/${currentUser?._id}`} className={`prof-nav-link ${isOwnProfile ? 'active' : ''}`}>
                        <User className="w-[16px] h-[16px]" /> Profile
                    </Link>
                    
                    <div className="prof-sidebar-divider"></div>
                    <div className="prof-sidebar-label">Mood</div>
                    <div style={{ padding: '6px 14px', fontSize: '13px', color: 'var(--prof-muted)' }}>
                        Feeling calm today
                    </div>
                </aside>

                {/* MAIN */}
                <main className="prof-main">
                    {/* Profile Header */}
                    <div className="prof-profile-header">
                        <div className="prof-profile-top">
                            <div className="prof-profile-avatar">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt={profile.username} />
                                ) : (
                                    profile.username?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="prof-profile-identity">
                                <h1 className="prof-profile-name">{profile.username}</h1>
                                <div className="prof-profile-handle">@{profile.username.toLowerCase().replace(/\s+/g, '')}</div>
                                <div className="prof-profile-bio">{profile.bio || 'Sharing moments of mindful scrolling.'}</div>
                                {profile.currentMood && (
                                    <div className="prof-current-mood">😌 Currently: {profile.currentMood}</div>
                                )}
                            </div>
                            
                            <div className="prof-profile-actions">
                                {isOwnProfile ? (
                                    <button onClick={handleEditProfile} className="prof-btn-secondary">
                                        <Edit className="w-[15px] h-[15px]" /> Edit profile
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleFollow} 
                                        className={isFollowing ? 'prof-btn-secondary' : 'prof-btn-primary'}
                                    >
                                        {isFollowing ? (
                                            <><UserMinus className="w-[15px] h-[15px] inline mr-1" /> Unfollow</>
                                        ) : (
                                            <><UserPlus className="w-[15px] h-[15px] inline mr-1" /> Follow</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="prof-profile-stats">
                            <div className="prof-stat">
                                <span className="prof-stat-num">{posts.length}</span>
                                <span className="prof-stat-label">Posts</span>
                            </div>
                            <div className="prof-stat">
                                <span className="prof-stat-num">{profile.followerCount || 0}</span>
                                <span className="prof-stat-label">Followers</span>
                            </div>
                            <div className="prof-stat">
                                <span className="prof-stat-num">{profile.followingCount || 0}</span>
                                <span className="prof-stat-label">Following</span>
                            </div>
                            <div className="prof-stat">
                                <span className="prof-stat-num">0</span>
                                <span className="prof-stat-label">Journeys</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="prof-profile-tabs">
                        <button 
                            className={`prof-ptab ${activeTab === 'posts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            Posts
                        </button>
                        <button 
                            className={`prof-ptab ${activeTab === 'saved' ? 'active' : ''}`}
                            onClick={() => setActiveTab('saved')}
                        >
                            Saved
                        </button>
                        <button 
                            className={`prof-ptab ${activeTab === 'journeys' ? 'active' : ''}`}
                            onClick={() => setActiveTab('journeys')}
                        >
                            Journeys
                        </button>
                    </div>

                    {/* Posts Grid */}
                    <div className="prof-posts-list">
                        {posts.length === 0 ? (
                            <div className="text-center py-12 border border-[#E4E0DA] bg-white rounded-xl">
                                <p className="text-[#9A9590]">
                                    {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                                </p>
                                {isOwnProfile && (
                                    <Link to="/create-post" className="prof-btn-primary mt-4 inline-block no-underline">
                                        Create First Post
                                    </Link>
                                )}
                            </div>
                        ) : (
                            posts.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    onUpdate={fetchUserPosts}
                                    onDelete={(id) => setPosts(posts.filter(p => p._id !== id))}
                                    isFollowing={isFollowing}
                                />
                            ))
                        )}
                    </div>
                </main>

                {/* RIGHT SIDEBAR (Static presentation for template completeness) */}
                <aside className="prof-right">
                    <div className="prof-panel-section">
                        <div className="prof-panel-heading">My Journeys</div>
                        <div className="prof-journey">
                            <div className="prof-journey-left">
                                <div className="prof-journey-name">One Beautiful Thing</div>
                                <div className="prof-prog"><div className="prof-prog-fill" style={{width: '73%'}}></div></div>
                                <div className="prof-journey-count">Day 5 of 7</div>
                            </div>
                            <span className="prof-journey-time">6h left</span>
                        </div>
                        <div className="prof-journey">
                            <div className="prof-journey-left">
                                <div className="prof-journey-name">Gratitude Week</div>
                                <div className="prof-prog"><div className="prof-prog-fill" style={{width: '43%'}}></div></div>
                                <div className="prof-journey-count">Day 3 of 7</div>
                            </div>
                            <span className="prof-journey-time">2d left</span>
                        </div>
                    </div>

                    <div className="prof-panel-section">
                        <div className="prof-panel-heading">Mood this week</div>
                        <div className="prof-mood-history">
                            <div className="prof-mood-row"><span className="prof-mood-day">Mon</span><div className="prof-mood-dot-sm" style={{background: '#B85C5C'}}></div><span className="prof-mood-label">Anxious</span></div>
                            <div className="prof-mood-row"><span className="prof-mood-day">Tue</span><div className="prof-mood-dot-sm" style={{background: '#7A9A7A'}}></div><span className="prof-mood-label">Calm</span></div>
                            <div className="prof-mood-row"><span className="prof-mood-day">Wed</span><div className="prof-mood-dot-sm" style={{background: '#D4A853'}}></div><span className="prof-mood-label">Happy</span></div>
                            <div className="prof-mood-row"><span className="prof-mood-day">Thu</span><div className="prof-mood-dot-sm" style={{background: '#7A9A7A'}}></div><span className="prof-mood-label">Calm</span></div>
                            <div className="prof-mood-row"><span className="prof-mood-day">Fri</span><div className="prof-mood-dot-sm" style={{background: '#9A7A8A'}}></div><span className="prof-mood-label">Grateful</span></div>
                            <div className="prof-mood-row"><span className="prof-mood-day">Sat</span><div className="prof-mood-dot-sm" style={{background: '#7A9A7A'}}></div><span className="prof-mood-label">Calm</span></div>
                            <div className="prof-mood-row"><span className="prof-mood-day">Sun</span><div className="prof-mood-dot-sm" style={{background: '#7A9A7A'}}></div><span className="prof-mood-label">Calm</span></div>
                        </div>
                    </div>

                    <div className="prof-panel-section">
                        <div className="prof-panel-heading">Scroll budget</div>
                        <div style={{fontSize: '12px', color: 'var(--prof-muted)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between'}}>
                            <span>This week</span><span>3h 20m / 7h</span>
                        </div>
                        <div style={{height: '3px', background: 'var(--prof-border)', borderRadius: '50px', overflow: 'hidden'}}>
                            <div style={{width: '48%', height: '100%', background: 'var(--prof-accent)', borderRadius: '50px'}}></div>
                        </div>
                        <div style={{fontSize: '11px', color: 'var(--prof-subtle)', mt: '5px'}}>Under budget — nice.</div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Profile;
