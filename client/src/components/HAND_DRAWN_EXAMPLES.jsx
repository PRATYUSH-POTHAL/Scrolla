/**
 * EXAMPLE: Refactored Feed Components with Hand-Drawn Design System
 * 
 * This file demonstrates how to integrate HandDrawn components
 * into the existing Feed page. Use these patterns for other pages.
 */

import React from 'react';
import HandDrawnButton from '../components/HandDrawnButton';
import HandDrawnCard from '../components/HandDrawnCard';
import HandDrawnInput from '../components/HandDrawnInput';
import HandDrawnBadge from '../components/HandDrawnBadge';
import { colors, radius, shadows } from '../styles/designSystem';

// ═══════════════════════════════════════════════════════════════════════
// COMPOSE BOX - Refactored with Hand-Drawn System
// ═══════════════════════════════════════════════════════════════════════

export const ComposeBox = ({ user, onPostClick }) => {
  return (
    <HandDrawnCard decoration="none" style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}>
        {/* Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: colors.accent,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Input & Button */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: colors.muted,
            padding: '12px 16px',
            borderRadius: '20px',
            marginBottom: '12px',
            cursor: 'pointer',
            color: colors.fg,
            opacity: 0.7,
          }}>
            What's on your mind?
          </div>
          
          <div style{{ display: 'flex', gap: '8px' }}>
            <HandDrawnButton
              variant="secondary"
              size="sm"
              onClick={() => console.log('Add image')}
            >
              📷 Image
            </HandDrawnButton>
            <HandDrawnButton
              variant="secondary"
              size="sm"
              onClick={() => console.log('Add video')}
            >
              🎥 Video
            </HandDrawnButton>
            <div style={{ marginLeft: 'auto' }}>
              <HandDrawnButton
                variant="primary"
                size="md"
                onClick={onPostClick}
              >
                + Post
              </HandDrawnButton>
            </div>
          </div>
        </div>
      </div>
    </HandDrawnCard>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MOOD SELECTOR - Refactored with Hand-Drawn System
// ═══════════════════════════════════════════════════════════════════════

export const MoodSelector = ({ selectedMood, onMoodChange, moods }) => {
  return (
    <HandDrawnCard decoration="tape" style={{ marginBottom: '16px' }}>
      <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
        Mood
      </h4>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}>
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onMoodChange(mood.id)}
            style={{
              padding: '10px',
              borderRadius: radius.wobbly,
              border: `2px solid ${selectedMood === mood.id ? colors.accent : colors.fg}`,
              background: selectedMood === mood.id ? colors.accent : colors.white,
              color: selectedMood === mood.id ? 'white' : colors.fg,
              cursor: 'pointer',
              fontFamily: 'Patrick Hand, cursive',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              if (selectedMood !== mood.id) {
                e.target.style.background = colors.muted;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedMood !== mood.id) {
                e.target.style.background = colors.white;
              }
            }}
          >
            {mood.emoji} {mood.label}
          </button>
        ))}
      </div>
    </HandDrawnCard>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SUGGESTED USERS CARD - Refactored with Hand-Drawn System
// ═══════════════════════════════════════════════════════════════════════

export const SuggestedUsers = ({ users, onFollow }) => {
  return (
    <HandDrawnCard decoration="tack">
      <h4 style={{
        marginBottom: '16px',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Suggested Users
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {users.map((user) => (
          <div
            key={user._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: radius.wobblySubtle,
              background: colors.muted,
            }}
          >
            {/* User Avatar */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: colors.accent,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}>
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Username */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                {user.followers?.length || 0} followers
              </div>
            </div>

            {/* Follow Button */}
            <HandDrawnButton
              variant="primary"
              size="sm"
              onClick={() => onFollow(user._id)}
            >
              Follow
            </HandDrawnButton>
          </div>
        ))}
      </div>
    </HandDrawnCard>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// POSTS FEED - Refactored with Hand-Drawn System
// ═══════════════════════════════════════════════════════════════════════

export const PostsList = ({ posts, onLike, onComment }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {posts.map((post) => (
        <HandDrawnCard key={post._id} decoration="none">
          {/* Post Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}>
            {/* User Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: colors.secondary,
              overflow: 'hidden',
            }}>
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={post.author.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                }}>
                  {post.author?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {post.author?.username}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Mood Badge */}
            {post.mood && post.mood !== 'all' && (
              <div style={{ marginLeft: 'auto' }}>
                <HandDrawnBadge variant="primary">
                  {post.mood}
                </HandDrawnBadge>
              </div>
            )}
          </div>

          {/* Post Content */}
          <p style={{ marginBottom: '12px', lineHeight: 1.6 }}>
            {post.content}
          </p>

          {/* Post Media */}
          {post.images && post.images.length > 0 && (
            <div style={{
              marginBottom: '12px',
              borderRadius: radius.wobblyMd,
              overflow: 'hidden',
            }}>
              {post.images[0] && (
                <img 
                  src={post.images[0]} 
                  alt="Post" 
                  style={{ 
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'cover',
                  }} 
                />
              )}
            </div>
          )}

          {/* Post Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            paddingTop: '12px',
            borderTop: `2px dashed ${colors.muted}`,
          }}>
            <HandDrawnButton
              variant="outline"
              size="sm"
              onClick={() => onLike(post._id)}
            >
              ❤️ {post.likes?.length || 0}
            </HandDrawnButton>
            <HandDrawnButton
              variant="outline"
              size="sm"
              onClick={() => onComment(post._id)}
            >
              💬 {post.comments?.length || 0}
            </HandDrawnButton>
          </div>
        </HandDrawnCard>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// COPY THIS PATTERN FOR OTHER PAGES!
// ═══════════════════════════════════════════════════════════════════════

/**
 * PATTERN SUMMARY:
 * 
 * 1. Import hand-drawn components and design tokens
 * 2. Wrap card containers in <HandDrawnCard> with optional decoration
 * 3. Replace buttons with <HandDrawnButton> (primary, secondary, outline)
 * 4. Use <HandDrawnInput> for form fields
 * 5. Use <HandDrawnBadge> for status indicators
 * 6. Use design tokens (colors, radius, shadows) for custom styling
 * 7. Combine inline styles with CSS for complex layouts
 * 8. Test responsive behavior on mobile devices
 */
