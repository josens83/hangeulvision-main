import { stub } from "./_stub";

// Profile
// TODO: hydrate from Prisma once DATABASE_URL is provisioned.
export const me = stub("user.me");
export const updateMe = stub("user.updateMe");
export const myStats = stub("user.myStats");
export const myStreak = stub("user.myStreak");
export const uploadAvatar = stub("user.uploadAvatar");
export const setLocale = stub("user.setLocale");

// Preferences
// TODO: persist to a UserPreference table (add in a follow-up migration).
export const getPreferences = stub("user.getPreferences");
export const updatePreferences = stub("user.updatePreferences");

// Bookmarks
// TODO: CRUD against the Bookmark model.
export const listBookmarks = stub("user.listBookmarks");
export const addBookmark = stub("user.addBookmark");
export const removeBookmark = stub("user.removeBookmark");

// Collections / decks
// TODO: wire to Collection, CollectionWord, Deck, DeckWord.
export const listCollections = stub("user.listCollections");
export const createCollection = stub("user.createCollection");
export const listDecks = stub("user.listDecks");
export const createDeck = stub("user.createDeck");

// Engagement
// TODO: aggregate from UserAchievement + Notification models.
export const listAchievements = stub("user.listAchievements");
export const listNotifications = stub("user.listNotifications");
export const markNotificationRead = stub("user.markNotificationRead");

// Goals
// TODO: upsert a Goal row per user.
export const getGoals = stub("user.getGoals");
export const setGoals = stub("user.setGoals");

// Data export & account deletion
// TODO: stream JSON of user + progress + payments; cascade delete on request.
export const exportData = stub("user.exportData");
export const deleteMe = stub("user.deleteMe");
