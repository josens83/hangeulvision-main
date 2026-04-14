import { stub } from "./_stub";

export const signup = stub("auth.signup");
export const login = stub("auth.login");
export const logout = stub("auth.logout");
export const refresh = stub("auth.refresh");

export const googleStart = stub("auth.googleStart");
export const googleCallback = stub("auth.googleCallback");

export const me = stub("auth.me");
export const updateMe = stub("auth.updateMe");
export const changePassword = stub("auth.changePassword");
export const deleteAccount = stub("auth.deleteAccount");

export const requestVerification = stub("auth.requestVerification");
export const confirmVerification = stub("auth.confirmVerification");
export const forgotPassword = stub("auth.forgotPassword");
export const resetPassword = stub("auth.resetPassword");
