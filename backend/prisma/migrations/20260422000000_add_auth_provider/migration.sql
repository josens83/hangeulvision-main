-- Auth provider enum + avatar
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'KAKAO');
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "provider" "AuthProvider" NOT NULL DEFAULT 'EMAIL';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
