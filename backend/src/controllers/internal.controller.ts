import { stub } from "./_stub";

// Claude content pipeline
export const generateContentContinuous = stub("internal.generateContentContinuous");
export const generateContent = stub("internal.generateContent");

// Stability AI images
export const generateConcept = stub("internal.generateConcept");
export const generateMnemonic = stub("internal.generateMnemonic");
export const generateRhyme = stub("internal.generateRhyme");

// Queue
export const enqueue = stub("internal.enqueue");
export const pending = stub("internal.pending");
export const complete = stub("internal.complete");
export const fail = stub("internal.fail");
