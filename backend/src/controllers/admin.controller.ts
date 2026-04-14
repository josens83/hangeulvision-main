import { stub } from "./_stub";

// Dashboards
export const stats = stub("admin.stats");
export const contentInventory = stub("admin.contentInventory");

// Users
export const listUsers = stub("admin.listUsers");
export const getUser = stub("admin.getUser");
export const updateUser = stub("admin.updateUser");
export const deleteUser = stub("admin.deleteUser");

// Words CRUD
export const listWords = stub("admin.listWords");
export const createWord = stub("admin.createWord");
export const getWord = stub("admin.getWord");
export const updateWord = stub("admin.updateWord");
export const deleteWord = stub("admin.deleteWord");

// Image queue
export const imageQueue = stub("admin.imageQueue");
export const retryImage = stub("admin.retryImage");

// Payments audit
export const listPayments = stub("admin.listPayments");
