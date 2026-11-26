"use client";

import * as React from "react";
import { Search, X, Mic, SlidersHorizontal, Clock, TrendingUp } from "lucide-react";

const RECENT_SEARCHES_KEY = "cineaste_recent_searches";

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const current = getRecentSearches().filter((item) => item !== query);
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify([query, ...current].slice(0, 6))
  );
}

interface DiscoverSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string) => void;
  aiMode: boolean;
  onToggleAi: () => void;
  suggestions?: string[];
  trending?: string[];
}

/**
 * Reconstructed 1:1 replica of Cineaste Discover Search Bar (Bbe)
 */
export function DiscoverSearchBar({
  value,
  onChange,
  onSubmit,
  aiMode,
  onToggleAi,
  suggestions = [],
  trending = [],
}: DiscoverSearchBarProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const handlePickSearch = (term: string) => {
    onChange(term);
    onSubmit(term);
    saveRecentSearch(term);
    setRecentSearches(getRecentSearches());
    setIsFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = value.trim();
    if (clean) {
      onSubmit(clean);
      saveRecentSearch(clean);
      setRecentSearches(getRecentSearches());
      setIsFocused(false);
    }
  };

  const handleClearRecent = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("")
          .trim();
        if (transcript) {
          onChange(transcript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (value.trim()) {
          onSubmit(value.trim());
          saveRecentSearch(value.trim());
          setRecentSearches(getRecentSearches());
        }
      };

      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const showDropdown = isFocused && !value.trim();

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9496A1]" />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={
            aiMode
              ? "Describe a vibe… e.g. time travel movie"
              : "Search films by title…"
          }
          className="w-full h-12 sm:h-14 pl-12 pr-28 rounded-2xl bg-card dark:bg-[#12141F] backdrop-blur border-0 outline-none focus:outline-none focus:ring-0 text-base text-foreground placeholder:text-muted-foreground shadow-[0_12px_36px_-10px_rgba(0,0,0,0.5)] transition-colors"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {/* Audio Wave Indicator when listening */}
          {isListening && (
            <div className="flex items-end gap-0.5 mr-1 h-5">
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  className="w-1 rounded-full bg-[#00D878] animate-pulse"
                  style={{
                    height: `${8 + (idx % 3) * 6}px`,
                    animationDelay: `${idx * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Clear Button */}
          {value.trim() && !isListening && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsFocused(true);
              }}
              className="w-8 h-8 grid place-items-center rounded-lg text-[#9496A1] hover:bg-[#181820] hover:text-[#F3F4F6] transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`w-8 h-8 grid place-items-center rounded-lg transition-colors ${
              isListening
                ? "bg-[#00D878]/15 text-[#00D878]"
                : "text-[#9496A1] hover:bg-[#181820] hover:text-[#F3F4F6]"
            }`}
            aria-label="Voice search"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* AI Assistant Button */}
          <button
            type="button"
            onClick={onToggleAi}
            className={`w-8 h-8 grid place-items-center rounded-lg transition-colors ${
              aiMode
                ? "bg-[#00D878]/15 text-[#00D878]"
                : "text-[#9496A1] hover:bg-[#181820] hover:text-[#F3F4F6]"
            }`}
            aria-label="Mood & Vibe Tuner"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggestion Dropdown (when focused and empty) */}
      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 rounded-2xl border-0 bg-popover dark:bg-[#12141F] backdrop-blur-xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)] p-3 z-40 max-h-[60vh] overflow-y-auto no-scrollbar origin-top animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Mood Suggestions */}
          {aiMode && suggestions.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00D878] mb-1.5 px-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Curated suggestions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickSearch(item)}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-full border-0 bg-secondary dark:bg-[#1A1D2B] text-muted-foreground hover:bg-[#00D878]/15 hover:text-[#00D878] transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9496A1]">
                  <Clock className="w-3.5 h-3.5" />
                  Recent
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClearRecent}
                  className="text-xs text-[#9496A1] hover:text-[#00D878] cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickSearch(item)}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-full border-0 bg-secondary dark:bg-[#1A1D2B] text-muted-foreground hover:bg-[#00D878]/15 hover:text-[#00D878] transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {trending.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9496A1] mb-1.5 px-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trending</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trending.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickSearch(item)}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-full border-0 bg-secondary dark:bg-[#1A1D2B] text-muted-foreground hover:bg-[#00D878]/15 hover:text-[#00D878] transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
