import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';
import {
  PlaylistSummary,
  SwipeCardItem,
  SwipeActionType,
  fetchPlaylistClips,
  performSwipeAction,
} from '../../lib/feedApi';
import { ClipItem } from '../../types';
import { SwipeCard } from './SwipeCard';
import { CloseActionIcon } from '../ActionIcons';

interface SwipeStackModalProps {
  playlist: PlaylistSummary;
  onClose: () => void;
  localClips?: ClipItem[];
  onStreakUpdate?: (newStreak: number) => void;
  onOpenNextPlaylist?: () => void;
}

export const SwipeStackModal: React.FC<SwipeStackModalProps> = ({
  playlist,
  onClose,
  localClips = [],
  onStreakUpdate,
  onOpenNextPlaylist,
}) => {
  const [cards, setCards] = useState<SwipeCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reviewedInSession, setReviewedInSession] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 1. Fetch cards for this playlist
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchPlaylistClips(playlist.id, localClips).then((fetchedCards) => {
      if (isMounted) {
        setCards(fetchedCards);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [playlist.id]);

  // 2. Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (cards.length === 0) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToIndex(Math.min(cards.length, activeIndex + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToIndex(Math.max(0, activeIndex - 1));
      } else if (e.key === 'l' || e.key === 'L') {
        const currentCard = cards[activeIndex];
        if (currentCard) handleAction(currentCard.id, 'like');
      } else if (e.key === 'r' || e.key === 'R') {
        const currentCard = cards[activeIndex];
        if (currentCard) handleAction(currentCard.id, 'reviewed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, cards, onClose]);

  // 3. Scroll tracking with IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop + container.clientHeight / 2;
      cardRefs.current.forEach((el, index) => {
        if (!el) return;
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (scrollPosition >= top && scrollPosition <= bottom) {
          setActiveIndex(index);
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [cards]);

  const scrollToIndex = (index: number) => {
    const target = cardRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveIndex(index);
    }
  };

  // 4. Action Dispatcher with Optimistic Updates
  const handleAction = async (cardId: string, action: SwipeActionType, note?: string) => {
    // Optimistically update local card state
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        if (action === 'like') return { ...c, is_liked: !c.is_liked };
        if (action === 'reviewed') return { ...c, is_reviewed: true };
        if (action === 'watchlist') return { ...c, is_watchlisted: !c.is_watchlisted };
        if (action === 'snooze') return { ...c, is_snoozed: true };
        if (action === 'note' && note) {
          return {
            ...c,
            notes: [...c.notes, { text: note, created_at: new Date().toISOString() }],
          };
        }
        return c;
      })
    );

    if (action === 'reviewed') {
      setReviewedInSession((prev) => prev + 1);
    }

    // Call backend API
    const res = await performSwipeAction(cardId, action, note);
    if (res.review_streak !== undefined && onStreakUpdate) {
      onStreakUpdate(res.review_streak);
    }
  };

  const progressPercent =
    cards.length > 0 ? Math.min(100, Math.round(((activeIndex + 1) / cards.length) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-2xl text-white animate-fadeIn overflow-hidden">
      {/* Top Progress Bar */}
      <div className="w-full h-1 bg-white/10 relative">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: playlist.color || '#3FE769',
            boxShadow: `0 0 10px ${playlist.color || '#3FE769'}`,
          }}
        />
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-white/10 bg-black/40 backdrop-blur-md">
        {/* Playlist Info */}
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shadow-lg"
            style={{
              backgroundColor: playlist.color || '#3FE769',
              boxShadow: `0 0 8px ${playlist.color || '#3FE769'}`,
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {playlist.title}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono font-bold">
                {playlist.badge}
              </span>
            </div>
            <p className="text-[11px] text-white/50">{playlist.subtitle}</p>
          </div>
        </div>

        {/* Counter & Close */}
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <span className="font-bold text-white">
              {cards.length > 0 ? Math.min(activeIndex + 1, cards.length) : 0}
            </span>
            <span className="text-white/40"> / </span>
            <span>{cards.length}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
            title="Close (Esc)"
          >
            <CloseActionIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Snap-to-Card Vertical Scroll Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth px-4 py-8 space-y-12"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/50">
            <div className="w-10 h-10 border-2 border-white/20 border-t-[#3FE769] rounded-full animate-spin" />
            <span className="text-xs font-mono">Curating stack cards...</span>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <p className="text-base text-white/80 font-medium">No clips found in this stack.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              Return to Feed
            </button>
          </div>
        ) : (
          <>
            {cards.map((card, idx) => (
              <div
                key={card.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                className="snap-center snap-always flex items-center justify-center py-4"
              >
                <SwipeCard
                  card={card}
                  onAction={handleAction}
                  isActive={activeIndex === idx}
                />
              </div>
            ))}

            {/* 🎉 Stack Complete Celebration Card */}
            <div
              ref={(el) => (cardRefs.current[cards.length] = el)}
              className="snap-center snap-always flex items-center justify-center py-6"
            >
              <div className="w-full max-w-md bg-[#121212]/95 border border-[#3FE769]/30 rounded-3xl p-8 text-center backdrop-blur-2xl shadow-2xl shadow-[#3FE769]/10">
                <div className="w-16 h-16 rounded-2xl bg-[#3FE769]/15 border border-[#3FE769]/30 flex items-center justify-center mx-auto mb-4 text-[#3FE769]">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
                  Stack Complete!
                </h3>
                <p className="text-sm text-white/60 mb-6">
                  You reviewed <span className="text-white font-bold">{cards.length}</span> clips in{' '}
                  <span className="text-[#3FE769] font-bold">{playlist.title}</span>.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <span className="block text-xl font-bold font-mono text-white">
                      {reviewedInSession}
                    </span>
                    <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider">
                      Mastered Today
                    </span>
                  </div>
                  <div>
                    <span className="block text-xl font-bold font-mono text-[#3FE769]">
                      +1
                    </span>
                    <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider">
                      Streak Days
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {onOpenNextPlaylist && (
                    <button
                      onClick={onOpenNextPlaylist}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3FE769] hover:bg-[#3FE769]/90 text-black font-bold text-xs transition-colors shadow-lg shadow-[#3FE769]/20"
                    >
                      <span>Next Stack</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors border border-white/10"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Keyboard Shortcuts Hint Footer */}
      <div className="hidden sm:flex items-center justify-center gap-6 py-2 border-t border-white/5 bg-black/50 text-[10px] text-white/40 font-mono">
        <span>↓ / ↑ navigate</span>
        <span>·</span>
        <span>L like</span>
        <span>·</span>
        <span>R review</span>
        <span>·</span>
        <span>Esc close</span>
      </div>
    </div>
  );
};
