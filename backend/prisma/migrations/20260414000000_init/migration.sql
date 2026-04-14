-- CreateEnum
CREATE TYPE "ExamCategory" AS ENUM ('TOPIK_I', 'TOPIK_II_MID', 'TOPIK_II_ADV', 'KIIP', 'EPS_TOPIK', 'THEME', 'GENERAL');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('free', 'basic', 'premium');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'editor', 'admin');

-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('NOUN', 'VERB', 'ADJ', 'ADV', 'PARTICLE', 'INTERJ', 'DET', 'PRONOUN', 'NUMERAL', 'OTHER');

-- CreateEnum
CREATE TYPE "OriginLanguage" AS ENUM ('SINO_KOREAN', 'NATIVE', 'LOANWORD', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ImageKind" AS ENUM ('CONCEPT', 'MNEMONIC', 'RHYME');

-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('QUEUED', 'GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('toss', 'paddle', 'mock');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('subscription', 'one_time');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'canceled');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('learn', 'review', 'quiz', 'flashcard');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('reminder', 'streak', 'achievement', 'system');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "tier" "Tier" NOT NULL DEFAULT 'free',
    "role" "Role" NOT NULL DEFAULT 'user',
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "romanization" TEXT NOT NULL,
    "ipa" TEXT,
    "phonetic" TEXT,
    "definitionEn" TEXT NOT NULL,
    "definitionJa" TEXT,
    "definitionVi" TEXT,
    "definitionZh" TEXT,
    "partOfSpeech" "PartOfSpeech" NOT NULL DEFAULT 'OTHER',
    "level" INTEGER NOT NULL,
    "exam" "ExamCategory" NOT NULL DEFAULT 'GENERAL',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordExamLevel" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "exam" "ExamCategory" NOT NULL,
    "level" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordExamLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etymology" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "language" "OriginLanguage" NOT NULL DEFAULT 'UNKNOWN',
    "rootWords" JSONB NOT NULL,
    "evolution" TEXT,
    "originEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Etymology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mnemonic" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "englishHint" TEXT NOT NULL,
    "syllables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mnemonic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Example" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "sentence" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "highlight" TEXT,
    "audioUrl" TEXT,

    CONSTRAINT "Example_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collocation" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "translation" TEXT NOT NULL,

    CONSTRAINT "Collocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordVisual" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "kind" "ImageKind" NOT NULL,
    "url" TEXT NOT NULL,
    "prompt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordVisual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordVideo" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageQueueItem" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "kind" "ImageKind" NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "ImageStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Synonym" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "Synonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Antonym" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "Antonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rhyme" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,

    CONSTRAINT "Rhyme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastGrade" INTEGER,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL DEFAULT 'review',
    "exam" "ExamCategory",
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cardsSeen" INTEGER NOT NULL DEFAULT 0,
    "cardsKnown" INTEGER NOT NULL DEFAULT 0,
    "cardsHard" INTEGER NOT NULL DEFAULT 0,
    "cardsMissed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPackage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "exam" "ExamCategory" NOT NULL,
    "priceUSD" DECIMAL(10,2) NOT NULL,
    "priceKRW" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 180,
    "paddleProductId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPackageWord" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductPackageWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "exam" "ExamCategory" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'mock',
    "kind" "PaymentKind" NOT NULL,
    "productId" TEXT NOT NULL,
    "amountUSD" DECIMAL(10,2) NOT NULL,
    "amountKRW" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "providerRef" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "threshold" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionWord" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CollectionWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exam" "ExamCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckWord" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DeckWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyCards" INTEGER NOT NULL DEFAULT 20,
    "weeklyReviews" INTEGER NOT NULL DEFAULT 140,
    "targetExam" "ExamCategory",
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exam" "ExamCategory",
    "score" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "User"("tier");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Word_exam_level_idx" ON "Word"("exam", "level");

-- CreateIndex
CREATE INDEX "Word_level_idx" ON "Word"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Word_word_partOfSpeech_key" ON "Word"("word", "partOfSpeech");

-- CreateIndex
CREATE INDEX "WordExamLevel_exam_level_idx" ON "WordExamLevel"("exam", "level");

-- CreateIndex
CREATE UNIQUE INDEX "WordExamLevel_wordId_exam_level_key" ON "WordExamLevel"("wordId", "exam", "level");

-- CreateIndex
CREATE UNIQUE INDEX "Etymology_wordId_key" ON "Etymology"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "Mnemonic_wordId_key" ON "Mnemonic"("wordId");

-- CreateIndex
CREATE INDEX "Example_wordId_position_idx" ON "Example"("wordId", "position");

-- CreateIndex
CREATE INDEX "Collocation_wordId_idx" ON "Collocation"("wordId");

-- CreateIndex
CREATE INDEX "WordVisual_wordId_idx" ON "WordVisual"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "WordVisual_wordId_kind_key" ON "WordVisual"("wordId", "kind");

-- CreateIndex
CREATE INDEX "WordVideo_wordId_format_idx" ON "WordVideo"("wordId", "format");

-- CreateIndex
CREATE INDEX "ImageQueueItem_status_createdAt_idx" ON "ImageQueueItem"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Synonym_wordId_relatedId_key" ON "Synonym"("wordId", "relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "Antonym_wordId_relatedId_key" ON "Antonym"("wordId", "relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "Rhyme_wordId_relatedId_key" ON "Rhyme"("wordId", "relatedId");

-- CreateIndex
CREATE INDEX "UserProgress_userId_dueAt_idx" ON "UserProgress"("userId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_wordId_key" ON "UserProgress"("userId", "wordId");

-- CreateIndex
CREATE INDEX "LearningSession_userId_startedAt_idx" ON "LearningSession"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPackage_slug_key" ON "ProductPackage"("slug");

-- CreateIndex
CREATE INDEX "ProductPackage_exam_active_idx" ON "ProductPackage"("exam", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPackageWord_packageId_wordId_key" ON "ProductPackageWord"("packageId", "wordId");

-- CreateIndex
CREATE INDEX "UserPurchase_userId_expiresAt_idx" ON "UserPurchase"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_userId_packageId_key" ON "UserPurchase"("userId", "packageId");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_wordId_key" ON "Bookmark"("userId", "wordId");

-- CreateIndex
CREATE INDEX "Collection_userId_idx" ON "Collection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionWord_collectionId_wordId_key" ON "CollectionWord"("collectionId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "DeckWord_deckId_wordId_key" ON "DeckWord"("deckId", "wordId");

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "League_slug_key" ON "League"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueParticipant_userId_leagueId_key" ON "LeagueParticipant"("userId", "leagueId");

-- CreateIndex
CREATE INDEX "Quiz_userId_createdAt_idx" ON "Quiz"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Chat_userId_createdAt_idx" ON "Chat"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_chatId_createdAt_idx" ON "ChatMessage"("chatId", "createdAt");

-- AddForeignKey
ALTER TABLE "WordExamLevel" ADD CONSTRAINT "WordExamLevel_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etymology" ADD CONSTRAINT "Etymology_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mnemonic" ADD CONSTRAINT "Mnemonic_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Example" ADD CONSTRAINT "Example_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collocation" ADD CONSTRAINT "Collocation_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordVisual" ADD CONSTRAINT "WordVisual_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordVideo" ADD CONSTRAINT "WordVideo_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageQueueItem" ADD CONSTRAINT "ImageQueueItem_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Synonym" ADD CONSTRAINT "Synonym_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Synonym" ADD CONSTRAINT "Synonym_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antonym" ADD CONSTRAINT "Antonym_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Antonym" ADD CONSTRAINT "Antonym_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rhyme" ADD CONSTRAINT "Rhyme_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rhyme" ADD CONSTRAINT "Rhyme_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPackageWord" ADD CONSTRAINT "ProductPackageWord_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ProductPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPackageWord" ADD CONSTRAINT "ProductPackageWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ProductPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionWord" ADD CONSTRAINT "CollectionWord_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionWord" ADD CONSTRAINT "CollectionWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckWord" ADD CONSTRAINT "DeckWord_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckWord" ADD CONSTRAINT "DeckWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueParticipant" ADD CONSTRAINT "LeagueParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueParticipant" ADD CONSTRAINT "LeagueParticipant_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

