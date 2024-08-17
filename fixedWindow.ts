import { Redis } from "ioredis";

const redisClient = new Redis();

async function rateLimitUsingFixedWindow(
  userID: string,
  intervalInSeconds: number,
  maximumRequests: number
): Promise<boolean> {
  const currentWindow = Math.floor(
    Date.now() / 1000 / intervalInSeconds
  ).toString();
  const key = `${userID}:${currentWindow}`;

  // Get current window count
  const value = await redisClient.get(key);
  const requestCount = value ? parseInt(value, 10) : 0;

  if (requestCount >= maximumRequests) {
    // Drop request
    return false;
  }

  // Increment request count by 1
  await redisClient.incr(key);

  // Handle request
  return true;

  // Note: Redis TTL for key expiration can be handled elsewhere depending on use case.
}
