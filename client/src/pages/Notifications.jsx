import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Users, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Notifications.css';

/* ── API base ──────────────────────────────────────────────────────── */
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

/* ── Time formatter ─────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Time-left formatter ────────────────────────────────────────────── */
function formatTimeLeft(ms) {
  if (!ms || ms <= 0) return null;
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  if (totalHours < 24) return `${totalHours}h left`;
  const days = Math.floor(totalHours / 24);
  const hrs = totalHours % 24;
  return hrs > 0 ? `${days}d ${hrs}h left` : `${days}d left`;
}

/* ── Avatar with fallback ───────────────────────────────────────────── */
function Avatar({ src, username, size = 40 }) {
  const [error, setError] = useState(false);
  if (src && !error) {
    return (
      <img
        src={src}
        alt={username}
        className="notif-avatar"
        style={{ width: size, height: size }}
        onError={() => setError(true)}
      />
    );
  }
  return (
    <div className="notif-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {(username || '?')[0].toUpperCase()}
    </div>
  );
}

/* ── Journey Invite Card ────────────────────────────────────────────── */
function JourneyInviteCard({ notif, token, onUpdate }) {
  const [maybeDone, setMaybeDone] = useState(notif.maybeLater || false);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  const journey = notif.journey;
  const isActive = journey?.isActive;
  const timeLeft = journey?.timeLeft ? formatTimeLeft(journey.timeLeft) : null;

  const handleJoin = async () => {
    if (!journey?._id) return;
    setJoining(true);
    try {
      const r = await fetch(`${API}/notifications/journey/${journey._id}/join`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ notificationId: notif._id }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.message || 'Failed to join'); return; }
      toast.success('Joined! 🎉');
      onUpdate(notif._id, { isRead: true });
      navigate(`/journeys/${journey._id}`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setJoining(false);
    }
  };

  const handleMaybeLater = async () => {
    try {
      const r = await fetch(`${API}/notifications/${notif._id}/maybe-later`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      setMaybeDone(true);
      onUpdate(notif._id, { isRead: true, maybeLater: true });
      toast.success("We'll remind you once when 24h remain.", { icon: '🔔' });
    } catch {
      toast.error('Could not set reminder');
    }
  };

  const cardClass = [
    'notif-card',
    !notif.isRead && 'unread',
    !isActive && 'ended',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      {!notif.isRead && <div className="notif-unread-dot" />}

      {/* Header */}
      <div className="notif-card-header">
        <Avatar src={notif.sender?.avatar} username={notif.sender?.username} />
        <div className="notif-card-meta">
          <div className="notif-card-title">
            <strong>{notif.sender?.username}</strong> invited you to join a journey
          </div>
          <div className="notif-card-subtitle">
            {notif.sender?.role ? `@${notif.sender.username} · ${notif.sender.role}` : `@${notif.sender?.username}`}
          </div>
        </div>
        <span className="notif-time">{timeAgo(notif.createdAt)}</span>
      </div>

      {/* Journey box */}
      {journey && (
        <div className="notif-journey-box">
          <div className="notif-journey-top">
            <span className="notif-journey-name">𝔍 {journey.title}</span>
            {isActive
              ? <span className="notif-badge-live">● Live</span>
              : <span className="notif-badge-ended">Ended</span>
            }
          </div>
          {journey.prompt && (
            <div className="notif-journey-prompt">"{journey.prompt}"</div>
          )}
          <div className="notif-journey-stats">
            <span>{journey.memberCount ?? '—'} members</span>
            {timeLeft && isActive && (
              <span className="notif-timeleft">{timeLeft}</span>
            )}
            {!isActive && journey.closedAt && (
              <span>ended {timeAgo(journey.closedAt)}</span>
            )}
          </div>
        </div>
      )}

      {/* Maybe Later reminder pill */}
      {maybeDone && (
        <div className="notif-reminder-pill">
          🔔 You'll get one reminder when 24h are left. Still no spam.
        </div>
      )}

      {/* Actions — only for active journeys */}
      {isActive && !maybeDone && (
        <div className="notif-actions">
          <div className="notif-actions-left">
            <button
              className="notif-btn-join"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? 'Joining…' : 'Join journey'}
            </button>
            <button className="notif-btn-maybe" onClick={handleMaybeLater}>
              Maybe later
            </button>
          </div>
          <span className="notif-time">{timeAgo(notif.createdAt)}</span>
        </div>
      )}
    </div>
  );
}

/* ── New Follower Card ──────────────────────────────────────────────── */
function FollowerCard({ notif, token, onUpdate }) {
  const [followState, setFollowState] = useState(
    notif.isFollowingBack ? 'following' : 'idle'
  ); // idle | following | loading
  const navigate = useNavigate();

  const handleFollowBack = async () => {
    if (followState === 'following') return;
    setFollowState('loading');
    try {
      const r = await fetch(`${API}/users/${notif.sender._id}/follow`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.message?.includes('Already following')) {
          setFollowState('following');
        } else {
          toast.error(data.message || 'Could not follow');
          setFollowState('idle');
        }
        return;
      }
      setFollowState('following');
      onUpdate(notif._id, { isRead: true });
    } catch {
      toast.error('Something went wrong');
      setFollowState('idle');
    }
  };

  const cardClass = [
    'notif-card',
    !notif.isRead && 'unread',
    notif.isRead && 'read-notif',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      {!notif.isRead && <div className="notif-unread-dot" />}

      <div className="notif-card-header">
        <button
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${notif.sender?._id}`)}
          aria-label={`View ${notif.sender?.username}'s profile`}
        >
          <Avatar src={notif.sender?.avatar} username={notif.sender?.username} />
        </button>
        <div className="notif-card-meta">
          <div className="notif-card-title">
            <strong>{notif.sender?.username}</strong> started following you
          </div>
          {notif.sender?.role && (
            <div className="notif-card-subtitle">
              @{notif.sender.username} · {notif.sender.role}
            </div>
          )}
        </div>
        {followState === 'following'
          ? <button className="notif-btn-following" disabled>Following</button>
          : (
            <button
              className="notif-btn-follow"
              onClick={handleFollowBack}
              disabled={followState === 'loading'}
            >
              {followState === 'loading' ? '…' : 'Follow back'}
            </button>
          )
        }
      </div>
    </div>
  );
}

/* ── Loading Skeleton ────────────────────────────────────────────────── */
function SkeletonList({ count = 3 }) {
  return (
    <div className="notif-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="notif-skeleton-card">
          <div className="skel skel-circle" style={{ width: 40, height: 40, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skel" style={{ height: 14, width: '65%' }} />
            <div className="skel" style={{ height: 12, width: '45%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════════ */
export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/notifications`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error('Failed to load');
      const data = await r.json();
      setNotifications(data.notifications || []);
    } catch {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Optimistic local update
  const handleUpdate = useCallback((id, patch) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, ...patch } : n)
    );
  }, []);

  const handleMarkAll = async () => {
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: 'PUT',
        headers: authHeaders(token),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All caught up ✓');
    } catch {
      toast.error('Could not mark as read');
    }
  };

  /* Partition into sections */
  const invites = notifications.filter(n => n.type === 'journey_invite');
  const followers = notifications.filter(n => n.type === 'new_follower');
  const hasUnread = notifications.some(n => !n.isRead);
  const isEmpty = !loading && notifications.length === 0;

  return (
    <div className="notif-page">
      {/* ─── Top Nav ─── */}
      <nav className="notif-nav">
        <button className="notif-nav-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="notif-nav-title">
          <h1>Notifications</h1>
          <span>Only what actually matters</span>
        </div>

        {hasUnread && !loading && (
          <button className="notif-mark-all" onClick={handleMarkAll}>
            Mark all read
          </button>
        )}
        {(!hasUnread || loading) && <div style={{ width: 90 }} />}
      </nav>

      {/* ─── Body ─── */}
      <main className="notif-body">

        {/* Error */}
        {error && (
          <div style={{ textAlign: 'center', color: 'var(--defi-muted)', padding: '2rem', fontSize: '0.875rem' }}>
            {error}
            <br />
            <button
              style={{ marginTop: '0.75rem', color: 'var(--defi-orange-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
              onClick={fetchNotifications}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <>
            <div>
              <div className="notif-section-label">Journey Invites</div>
              <SkeletonList count={2} />
            </div>
            <div>
              <div className="notif-section-label">New Followers</div>
              <SkeletonList count={2} />
            </div>
          </>
        )}

        {/* Empty */}
        {isEmpty && !error && (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <Bell size={24} />
            </div>
            <h3>You're all caught up</h3>
            <p>
              Scrolla won't ping you for likes, comments, or anything else.
            </p>
            <div className="notif-empty-brand">
              "Your attention is yours."
            </div>
          </div>
        )}

        {/* Journey Invites section */}
        {!loading && !error && invites.length > 0 && (
          <div>
            <div className="notif-section-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Compass size={11} />
              Journey Invites
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {invites.map(n => (
                <JourneyInviteCard
                  key={n._id}
                  notif={n}
                  token={token}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* New Followers section */}
        {!loading && !error && followers.length > 0 && (
          <div>
            <div className="notif-section-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={11} />
              New Followers
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {followers.map(n => (
                <FollowerCard
                  key={n._id}
                  notif={n}
                  token={token}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer brand statement — always shown after content loads */}
        {!loading && !error && !isEmpty && (
          <div className="notif-footer-caption">
            You're all caught up. Scrolla won't ping you for likes,<br />
            comments, or anything else. Your attention is yours.
          </div>
        )}
      </main>
    </div>
  );
}
