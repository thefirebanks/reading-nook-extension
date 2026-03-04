// ─── Core Data Types ────────────────────────────────────────────

export type ContentType = 'article' | 'video' | 'tweet' | 'paper' | 'other';
export type ItemStatus = 'unread' | 'reading' | 'read' | 'archived';
export type Rating = 'worth-it' | 'meh' | 'not-worth-it';

export interface ReadingItem {
  id: string;
  url: string;
  title: string;
  description: string;
  thumbnail?: string;
  siteName: string;
  contentType: ContentType;
  estimatedReadTime?: number; // minutes
  savedAt: number; // timestamp
  readAt?: number; // timestamp when marked read
  status: ItemStatus;
  category?: string;
  tags: string[];
  reflection?: Reflection;
  nudgeCount: number;
  lastNudgedAt?: number;
}

export interface Reflection {
  takeaway: string; // one-line forced brevity
  rating: Rating;
  notes?: string; // optional longer notes
  wantMoreLikeThis: boolean;
  completedAt: number;
}

// ─── Stats & Tracking ───────────────────────────────────────────

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalRead: number;
  totalSaved: number;
  lastReadDate: string; // YYYY-MM-DD
  weeklyHistory: WeekSummary[];
}

export interface WeekSummary {
  weekStart: string; // YYYY-MM-DD
  saved: number;
  read: number;
  topTags: string[];
  reflections: string[]; // takeaway snippets
}

// ─── Settings ───────────────────────────────────────────────────

export interface UserSettings {
  nudgeEnabled: boolean;
  nudgeFrequencyHours: number;
  tabThreshold: number; // nudge when tabs exceed this count
  decayDays: number; // days before flagging stale items
  autoArchiveDays: number; // days before auto-archiving
  focusModeBlockList: string[];
  focusModeEnabled: boolean;
  sessionDurationMinutes: number; // target reading session length
}

// ─── Messages ───────────────────────────────────────────────────

export type MessageType =
  | 'SAVE_PAGE'
  | 'CHECK_SAVED'
  | 'EXTRACT_METADATA'
  | 'GET_ITEMS'
  | 'UPDATE_ITEM'
  | 'DELETE_ITEM'
  | 'OPEN_FOCUS_MODE'
  | 'START_SESSION'
  | 'GET_STATS'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS';

export interface Message {
  type: MessageType;
  payload?: unknown;
}

// ─── Page Metadata (extracted by content script) ────────────────

export interface PageMetadata {
  url: string;
  title: string;
  description: string;
  thumbnail?: string;
  siteName: string;
  contentType: ContentType;
  estimatedReadTime?: number;
}
