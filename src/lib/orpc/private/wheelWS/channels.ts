// Channel ID of a user's wheel overlay: every overlay with that user's link listens on it.
export const wheelChannel = (userId: number) => `wheel:${userId}`
