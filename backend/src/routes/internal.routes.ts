import { Router } from "express";
import * as c from "../controllers/internal.controller";
import { internalOnly } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";

// Endpoints hit by the AI content + image pipelines. All require X-Internal-Key.
export const internalRouter = Router();

internalRouter.use(internalOnly);

// Claude content generation.
// New endpoints (preferred, schema-explicit names).
// Both GET and POST work — GET reads params from the query string for
// browser-paste convenience; POST reads from JSON body. `internalOnly`
// accepts the key from either the X-Internal-Key header or ?key=… query.
internalRouter.get("/generate-words", asyncHandler(c.generateWords));
internalRouter.post("/generate-words", asyncHandler(c.generateWords));
internalRouter.get("/generate-words-batch", asyncHandler(c.generateWordsBatch));
internalRouter.post("/generate-words-batch", asyncHandler(c.generateWordsBatch));
// Legacy aliases kept for VocaVision-parity tooling:
internalRouter.post("/generate-content-continuous", asyncHandler(c.generateContentContinuous));
internalRouter.post("/generate-content", asyncHandler(c.generateContent));

// Stability AI image generation — batch pipeline
internalRouter.get("/generate-images", asyncHandler(c.generateImages));
internalRouter.post("/generate-images", asyncHandler(c.generateImages));
// Legacy single-image stubs
internalRouter.post("/images/concept", asyncHandler(c.generateConcept));
internalRouter.post("/images/mnemonic", asyncHandler(c.generateMnemonic));
internalRouter.post("/images/rhyme", asyncHandler(c.generateRhyme));

// Queue management
internalRouter.post("/queue/enqueue", asyncHandler(c.enqueue));
internalRouter.get("/queue/pending", asyncHandler(c.pending));
internalRouter.post("/queue/:id/complete", asyncHandler(c.complete));
internalRouter.post("/queue/:id/fail", asyncHandler(c.fail));
