import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Bell, Home, Search, Map, Bookmark, User, CheckCircle } from 'lucide-react';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { postService } from '../services/postService';
import { userService } from '../services/userService';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { MOODS } from '../utils/constants';
import './Feed.css';

const Feed = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { kidsMode, toggleKidsMode, journeyTime, journeyStartTime, startJourney, endJourney } = useApp();

    const [selectedMood, setSelectedMood] = useState('all');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [journeyComplete, setJourneyComplete] = useState(false);
    const [activeTab, setActiveTab] = useState('foryou');

    // Suggested users state
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set());

    // Load suggested users on mount
    useEffect(() => {
        fetchSuggestedUsers();
        fetchFollowingList();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [selectedMood, kidsMode, activeTab]);

    useEffect(() => {
        if (journeyTime && journeyStartTime) {
            const endTime = journeyStartTime + journeyTime * 60000;

            const timer = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, endTime - now);
                setTimeRemaining(remaining);

                if (remaining === 0) {
                    handleJourneyEnd();
                    clearInterval(timer);
                }
            }, 1000);

            return () => clearInterval(timer);
        } else {
            setTimeRemaining(null);
        }
    }, [journeyTime, journeyStartTime]);

    const fetchFollowingList = async () => {
        if (!user?._id) return;
        try {
            const following = await userService.getFollowing(user._id);
            setFollowingIds(new Set(following.map(u => u._id)));
        } catch (err) {
            console.error('Error fetching following list:', err);
        }
    };

    const fetchSuggestedUsers = async () => {
        try {
            const users = await userService.getSuggestedUsers();
            setSuggestedUsers(users);
        } catch (err) {
            console.error('Error fetching suggested users:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const filters = {};

            if (selectedMood !== 'all') {
                filters.mood = selectedMood;
            }

            if (kidsMode) {
                filters.kidSafe = 'true';
            }

            // "For you" / Home = following only, "Explore" = all posts
            if (activeTab === 'foryou') {
                filters.following = 'true';
            }
            // "following" tab also shows followed users
            if (activeTab === 'following') {
                filters.following = 'true';
            }
            // "trending" and "journeys" tabs = all posts (explore)

            filters.limit = 50;

            const data = await postService.getPosts(filters);
            const allPosts = data.posts || [];
            // Don't show current user's own posts in the feed — only on their profile
            setPosts(allPosts.filter(p => p.author?._id !== user?._id));
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowUser = async (userId) => {
        try {
            await userService.followUser(userId);
            setFollowingIds(prev => new Set([...prev, userId]));
            // Remove from suggested
            setSuggestedUsers(prev => prev.filter(u => u._id !== userId));
            // Refresh feed if on foryou tab
            if (activeTab === 'foryou' || activeTab === 'following') {
                fetchPosts();
            }
        } catch (err) {
            console.error('Error following user:', err);
        }
    };

    const handleJourneyEnd = () => {
        setJourneyComplete(true);
        endJourney();
    };

    const handleNewJourney = () => {
        setJourneyComplete(false);
    };

    const formatTime = (ms) => {
        if (ms === null) return '';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Switch to explore to see all posts
    const handleExploreClick = () => {
        setActiveTab('trending'); // trending = explore = all posts
        setSelectedMood('all');
    };

    if (journeyComplete) {
        return (
            <div className="feed-page-wrapper" style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
                <div style={{background:'white', padding:'32px', borderRadius:'12px', border:'1px solid #E4E0DA', textAlign:'center', maxWidth:'400px', width:'100%'}}>
                    <CheckCircle style={{width:'80px', height:'80px', color:'#6B7F6E', margin:'0 auto 24px'}} />
                    <h1 style={{fontSize:'24px', fontWeight:'bold', color:'#2C2B28', marginBottom:'16px'}}>
                        Journey Complete!
                    </h1>
                    <p style={{color:'#9A9590', marginBottom:'32px'}}>
                        You've completed your mindful journey. Time to take a break!
                    </p>
                    <button
                        onClick={handleNewJourney}
                        style={{width:'100%', padding:'12px', borderRadius:'8px', border:'none', background:'#6B7F6E', color:'white', fontSize:'14px', fontWeight:'500', cursor:'pointer'}}
                    >
                        Continue Browsing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="feed-page-wrapper">
            {/* NAV */}
            <nav className="feed-nav">
                <Link to="/feed" className="feed-logo">Scrolla</Link>
                <div className="feed-nav-end">
                    <button className="feed-icon-btn" title="Messages">
                        <MessageSquare className="w-[18px] h-[18px]" />
                    </button>
                    <button className="feed-icon-btn" title="Notifications">
                        <Bell className="w-[18px] h-[18px]" />
                        <div className="feed-notif-dot"></div>
                    </button>
                    <div className="feed-nav-divider"></div>
                    <button 
                        className="feed-avatar" 
                        onClick={() => navigate(`/profile/${user?._id}`)}
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Me" />
                        ) : (
                            user?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                    </button>
                    <button onClick={handleLogout} style={{marginLeft:'8px', fontSize:'12px', color:'#b91c1c', background:'none', border:'none', cursor:'pointer'}}>Logout</button>
                </div>
            </nav>

            <div className="feed-layout">
                {/* SIDEBAR */}
                <aside className="feed-sidebar">
                    <button 
                        className={`feed-nav-link ${activeTab === 'foryou' ? 'active' : ''}`}
                        onClick={() => setActiveTab('foryou')}
                    >
                        <Home className="w-[16px] h-[16px]" /> Home
                    </button>
                    <button 
                        className={`feed-nav-link ${activeTab === 'trending' ? 'active' : ''}`}
                        onClick={handleExploreClick}
                    >
                        <Search className="w-[16px] h-[16px]" /> Explore
                    </button>
                    <Link to="#" className="feed-nav-link">
                        <Map className="w-[16px] h-[16px]" /> Journeys
                        {timeRemaining !== null && (
                            <span style={{marginLeft:'auto', fontSize:'11px', fontWeight:'bold', color:'#6B7F6E', background:'#EDF0EE', padding:'2px 8px', borderRadius:'50px'}}>
                                {formatTime(timeRemaining)}
                            </span>
                        )}
                    </Link>
                    <Link to="#" className="feed-nav-link">
                        <Bookmark className="w-[16px] h-[16px]" /> Saved
                    </Link>
                    <Link to={`/profile/${user?._id}`} className="feed-nav-link">
                        <User className="w-[16px] h-[16px]" /> Profile
                    </Link>

                    <div className="feed-sidebar-divider"></div>

                    <div className="feed-sidebar-label">Mood</div>
                    
                    <button 
                        className={`feed-mood-item ${selectedMood === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedMood('all')}
                    >
                        <div className="feed-mood-dot"></div> All moods
                    </button>
                    {MOODS.filter(m => m.id !== 'all').map(mood => (
                        <button 
                            key={mood.id}
                            className={`feed-mood-item ${selectedMood === mood.id ? 'active' : ''}`}
                            onClick={() => setSelectedMood(mood.id)}
                        >
                            <div className="feed-mood-dot"></div> {mood.label}
                        </button>
                    ))}

                    <div className="feed-sidebar-divider"></div>

                    <div className="feed-kids-row" onClick={toggleKidsMode}>
                        <div className={`feed-toggle ${kidsMode ? 'on' : ''}`}></div>
                        <span style={{fontSize:'13px', color:'var(--feed-muted)'}}>Kids mode</span>
                    </div>

                    <div className="feed-sidebar-divider"></div>

                    <div className="feed-sidebar-label">Scroll budget</div>
                    <div className="feed-budget-wrap">
                        <div className="feed-budget-label">
                            <span>Today</span>
                            <span>{timeRemaining !== null ? 'Active' : '42 / 60 min'}</span>
                        </div>
                        <div className="feed-budget-bar">
                            <div className="feed-budget-fill" style={{ width: timeRemaining !== null ? '100%' : '70%' }}></div>
                        </div>
                    </div>
                </aside>

                {/* FEED */}
                <main className="feed-main">
                    {/* Compose */}
                    <div className="feed-compose" onClick={() => navigate('/create-post')}>
                        <div className="feed-compose-avatar">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Me" />
                            ) : (
                                user?.username?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="feed-compose-placeholder">What's on your mind?</div>
                        <button className="feed-compose-btn" onClick={(e) => { e.stopPropagation(); navigate('/create-post'); }}>
                            + Post
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="feed-tabs">
                        <button 
                            className={`feed-tab ${activeTab === 'foryou' ? 'active' : ''}`}
                            onClick={() => setActiveTab('foryou')}
                        >
                            For you
                        </button>
                        <button 
                            className={`feed-tab ${activeTab === 'following' ? 'active' : ''}`}
                            onClick={() => setActiveTab('following')}
                        >
                            Following
                        </button>
                        <button 
                            className={`feed-tab ${activeTab === 'trending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('trending')}
                        >
                            Explore
                        </button>
                    </div>

                    {/* Posts List */}
                    <div className="feed-post-list">
                        {loading ? (
                            <LoadingSpinner message="Loading posts..." />
                        ) : posts.length === 0 ? (
                            <div style={{background:'white', border:'1px solid #E4E0DA', borderRadius:'12px', textAlign:'center', padding:'48px 16px'}}>
                                <p style={{color:'#9A9590', marginBottom:'16px'}}>
                                    {activeTab === 'foryou' || activeTab === 'following'
                                        ? "You're not following anyone yet. Explore posts and follow users!"
                                        : kidsMode
                                            ? 'No kid-safe posts found matching your mood.'
                                            : 'No posts yet for this mood. Be the first to create one!'}
                                </p>
                                {(activeTab === 'foryou' || activeTab === 'following') && (
                                    <button
                                        onClick={handleExploreClick}
                                        style={{padding:'10px 20px', borderRadius:'8px', border:'none', background:'#6B7F6E', color:'white', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}
                                    >
                                        Explore Posts
                                    </button>
                                )}
                            </div>
                        ) : (
                            posts.map((post) => (
                                <PostCard 
                                    key={post._id} 
                                    post={post} 
                                    onUpdate={fetchPosts} 
                                    onDelete={fetchPosts} 
                                    isFollowing={followingIds.has(post.author?._id)}
                                />
                            ))
                        )}
                    </div>
                </main>

                {/* RIGHT PANEL */}
                <aside className="feed-right">
                    <div className="feed-panel-section">
                        <div className="feed-panel-heading">Active Journeys</div>
                        <div className="feed-journey" onClick={() => startJourney(60)}>
                            <div className="feed-journey-left">
                                <div className="feed-journey-name">Deep Focus (60m)</div>
                                <div className="feed-prog"><div className="feed-prog-fill" style={{width: '0%'}}></div></div>
                                <div className="feed-journey-count">Click to start</div>
                            </div>
                        </div>
                        <div className="feed-journey" onClick={() => startJourney(30)}>
                            <div className="feed-journey-left">
                                <div className="feed-journey-name">Digital Detox (30m)</div>
                                <div className="feed-prog"><div className="feed-prog-fill" style={{width: '0%'}}></div></div>
                                <div className="feed-journey-count">Click to start</div>
                            </div>
                        </div>
                        <div className="feed-journey" onClick={() => startJourney(15)}>
                            <div className="feed-journey-left">
                                <div className="feed-journey-name">Quick Break (15m)</div>
                                <div className="feed-prog"><div className="feed-prog-fill" style={{width: '0%'}}></div></div>
                                <div className="feed-journey-count">Click to start</div>
                            </div>
                        </div>
                    </div>

                    {/* Suggested Users — real data */}
                    <div className="feed-panel-section">
                        <div className="feed-panel-heading">Suggested</div>
                        {suggestedUsers.length > 0 ? (
                            <div style={{background:'var(--feed-card)', border:'1px solid var(--feed-border)', borderRadius:'8px', padding:'10px 12px'}}>
                                {suggestedUsers.map(sUser => (
                                    <div className="feed-suggest" key={sUser._id}>
                                        <div 
                                            className="feed-sug-avatar" 
                                            style={{cursor:'pointer', overflow:'hidden'}}
                                            onClick={() => navigate(`/profile/${sUser._id}`)}
                                        >
                                            {sUser.avatar && !sUser.avatar.includes('dicebear') ? (
                                                <img src={sUser.avatar} alt={sUser.username} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} />
                                            ) : (
                                                sUser.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="feed-sug-info" style={{cursor:'pointer'}} onClick={() => navigate(`/profile/${sUser._id}`)}>
                                            <span className="feed-sug-name">{sUser.username}</span>
                                            <span className="feed-sug-sub">{sUser.followerCount} followers</span>
                                        </div>
                                        <button 
                                            className="feed-follow"
                                            onClick={() => handleFollowUser(sUser._id)}
                                        >
                                            Follow
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{fontSize:'12px', color:'var(--feed-muted)', padding:'8px 0'}}>
                                You're following everyone! 🎉
                            </div>
                        )}
                    </div>

                    <div className="feed-panel-section">
                        <div className="feed-panel-heading">Mood trends today</div>
                        <div className="feed-trend-row">
                            <span className="feed-trend-label">Happy</span>
                            <div className="feed-trend-bar-wrap"><div className="feed-trend-bar" style={{width: '82%'}}></div></div>
                            <span className="feed-trend-pct">82%</span>
                        </div>
                        <div className="feed-trend-row">
                            <span className="feed-trend-label">Calm</span>
                            <div className="feed-trend-bar-wrap"><div className="feed-trend-bar" style={{width: '61%'}}></div></div>
                            <span className="feed-trend-pct">61%</span>
                        </div>
                        <div className="feed-trend-row">
                            <span className="feed-trend-label">Grateful</span>
                            <div className="feed-trend-bar-wrap"><div className="feed-trend-bar" style={{width: '47%'}}></div></div>
                            <span className="feed-trend-pct">47%</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Feed;
