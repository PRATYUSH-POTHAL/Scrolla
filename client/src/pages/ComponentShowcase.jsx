/**
 * Hand-Drawn Component Showcase
 * 
 * This page demonstrates all hand-drawn components in action.
 * Navigate to /showcase to see live previews.
 * 
 * To use: Add this to your routes in App.jsx
 * <Route path="/showcase" element={<ComponentShowcase />} />
 */

import React, { useState } from 'react';
import HandDrawnButton from '../components/HandDrawnButton';
import HandDrawnCard from '../components/HandDrawnCard';
import HandDrawnInput from '../components/HandDrawnInput';
import HandDrawnBadge from '../components/HandDrawnBadge';
import { colors, radius, shadows, typography } from '../styles/designSystem';

const ComponentShowcase = () => {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectedMood, setSelectedMood] = useState('joyful');

  const moods = [
    { id: 'calm', label: 'Calm', emoji: '🧘' },
    { id: 'focused', label: 'Focused', emoji: '🎯' },
    { id: 'reflective', label: 'Reflective', emoji: '🤔' },
    { id: 'joyful', label: 'Joyful', emoji: '😊' },
    { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  ];

  return (
    <div style={{
      background: colors.bg,
      color: colors.fg,
      fontFamily: typography.body.fontFamily,
      minHeight: '100vh',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            🎨 Hand-Drawn Component Showcase
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.7 }}>
            Live preview of all components in the design system
          </p>
        </div>

        {/* BUTTONS SECTION */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>
            Buttons
          </h2>
          
          <HandDrawnCard decoration="tape">
            <h3 style={{ marginBottom: '20px' }}>Primary Variant</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <HandDrawnButton variant="primary" size="sm">
                Small Button
              </HandDrawnButton>
              <HandDrawnButton variant="primary" size="md">
                Medium Button
              </HandDrawnButton>
              <HandDrawnButton variant="primary" size="lg">
                Large Button
              </HandDrawnButton>
              <HandDrawnButton variant="primary" disabled>
                Disabled
              </HandDrawnButton>
            </div>
          </HandDrawnCard>

          <HandDrawnCard decoration="none" style={{ marginTop: '16px' }}>
            <h3 style={{ marginBottom: '20px' }}>Secondary Variant</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <HandDrawnButton variant="secondary" size="sm">
                Small Button
              </HandDrawnButton>
              <HandDrawnButton variant="secondary" size="md">
                Medium Button
              </HandDrawnButton>
              <HandDrawnButton variant="secondary" size="lg">
                Large Button
              </HandDrawnButton>
            </div>
          </HandDrawnCard>

          <HandDrawnCard decoration="none" style={{ marginTop: '16px' }}>
            <h3 style={{ marginBottom: '20px' }}>Outline Variant</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <HandDrawnButton variant="outline" size="sm">
                Small Button
              </HandDrawnButton>
              <HandDrawnButton variant="outline" size="md">
                Medium Button
              </HandDrawnButton>
              <HandDrawnButton variant="outline" size="lg">
                Large Button
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </section>

        {/* CARDS SECTION */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>
            Cards
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <HandDrawnCard decoration="none">
              <h3 style={{ marginBottom: '8px' }}>Default Card</h3>
              <p>A simple card with no decoration. Perfect for content cards and containers.</p>
            </HandDrawnCard>

            <HandDrawnCard decoration="tape">
              <h3 style={{ marginBottom: '8px' }}>With Tape</h3>
              <p>Features a tape decoration at the top. Great for "pinned" or important content.</p>
            </HandDrawnCard>

            <HandDrawnCard decoration="tack">
              <h3 style={{ marginBottom: '8px' }}>With Thumbtack</h3>
              <p>Decorated with a red thumbtack. Perfect for highlighted features.</p>
            </HandDrawnCard>

            <HandDrawnCard decoration="sticky-note">
              <h3 style={{ marginBottom: '8px' }}>Sticky Note Style</h3>
              <p>Small sticky note decoration in the corner. Fun and playful!</p>
            </HandDrawnCard>
          </div>
        </section>

        {/* INPUTS SECTION */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>
            Inputs
          </h2>

          <HandDrawnCard decoration="none">
            <h3 style={{ marginBottom: '16px' }}>Text Input</h3>
            <HandDrawnInput
              type="text"
              placeholder="Type something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            {inputValue && (
              <p style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.6 }}>
                You typed: {inputValue}
              </p>
            )}
          </HandDrawnCard>

          <HandDrawnCard decoration="none" style={{ marginTop: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>Textarea</h3>
            <HandDrawnInput
              type="textarea"
              placeholder="Write your thoughts here..."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              rows={4}
            />
            <div style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.6 }}>
              Characters: {textareaValue.length}
            </div>
          </HandDrawnCard>

          <HandDrawnCard decoration="none" style={{ marginTop: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>Search Input</h3>
            <HandDrawnInput
              type="search"
              placeholder="Search users, posts..."
            />
          </HandDrawnCard>
        </section>

        {/* BADGES SECTION */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>
            Badges
          </h2>

          <HandDrawnCard decoration="none">
            <h3 style={{ marginBottom: '16px' }}>Color Variants</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <HandDrawnBadge variant="primary">NEW</HandDrawnBadge>
              <HandDrawnBadge variant="secondary">FEATURED</HandDrawnBadge>
              <HandDrawnBadge variant="muted">ARCHIVED</HandDrawnBadge>
              <HandDrawnBadge variant="success">ACTIVE</HandDrawnBadge>
              <HandDrawnBadge variant="warning">PENDING</HandDrawnBadge>
              <HandDrawnBadge variant="danger">BLOCKED</HandDrawnBadge>
            </div>
          </HandDrawnCard>
        </section>

        {/* COLORS SECTION */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>
            Color Palette
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { name: 'Background', color: colors.bg },
              { name: 'Foreground', color: colors.fg },
              { name: 'Muted', color: colors.muted },
              { name: 'Accent', color: colors.accent },
              { name: 'Secondary', color: colors.secondary },
              { name: 'White', color: colors.white },
            ].map((item) => (
              <HandDrawnCard key={item.name} decoration="none">
                <div style={{
                  width: '100%',
                  height: '80px',
                  background: item.color,
                  borderRadius: radius.wobblyMd,
                  marginBottom: '12px',
                  border: `2px solid ${colors.fg}`,
                }}></div>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>{item.color}</div>
              </HandDrawnCard>
            ))}
          </div>
        </section>

        {/* MOOD SELECTOR (EXAMPLE) */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>
            Interactive Example: Mood Selector
          </h2>

          <HandDrawnCard decoration="tape">
            <h3 style={{ marginBottom: '16px' }}>How are you feeling?</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '8px',
            }}>
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  style={{
                    padding: '12px',
                    borderRadius: radius.wobbly,
                    border: `2px solid ${selectedMood === mood.id ? colors.accent : colors.fg}`,
                    background: selectedMood === mood.id ? colors.accent : colors.white,
                    color: selectedMood === mood.id ? 'white' : colors.fg,
                    cursor: 'pointer',
                    fontFamily: typography.body.fontFamily,
                    fontSize: '1rem',
                    fontWeight: 600,
                    transition: 'all 150ms ease-out',
                  }}
                >
                  {mood.emoji} {mood.label}
                </button>
              ))}
            </div>
            {selectedMood && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: colors.muted,
                borderRadius: radius.wobblySubtle,
                textAlign: 'center',
              }}>
                Selected mood: <strong>{moods.find(m => m.id === selectedMood)?.label}</strong>
              </div>
            )}
          </HandDrawnCard>
        </section>

        {/* TYPOGRAPHY SECTION */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>
            Typography
          </h2>

          <HandDrawnCard decoration="none">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Heading 1 (Kalam)</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Heading 2 (Kalam)</h2>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Heading 3 (Kalam)</h3>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Heading 4 (Kalam)</h4>
            <p style={{ marginBottom: '12px' }}>
              Body text uses Patrick Hand font. This is the default text style for all paragraphs, descriptions, and content.
            </p>
            <small>Small text for captions and secondary information</small>
          </HandDrawnCard>
        </section>

        {/* FOOTER */}
        <section style={{ textAlign: 'center', marginTop: '60px', opacity: 0.6 }}>
          <p>🎨 Hand-Drawn Design System © 2024</p>
          <p style={{ fontSize: '0.9rem' }}>This showcase demonstrates all available components and design tokens.</p>
        </section>
      </div>
    </div>
  );
};

export default ComponentShowcase;
