import { RedisClientType, createClient, ZAddOptions } from "redis";

type RedisClient = RedisClientType;

const redisClient: RedisClient = createClient();

interface RateLimitOptions {
  userID: string;
  uniqueRequestID: string;
  intervalInSeconds: number;
  maximumRequests: number;
}

async function rateLimitUsingSlidingLogs({
  userID,
  uniqueRequestID,
  intervalInSeconds,
  maximumRequests,
}: RateLimitOptions): Promise<boolean> {
  const currentTime = Math.floor(Date.now() / 1000).toString();
  const lastWindowTime = (
    Math.floor(Date.now() / 1000) - intervalInSeconds
  ).toString();

  // Get current window count
  const requestCount = await redisClient.zCount(
    userID,
    lastWindowTime,
    currentTime
  );

  if (requestCount >= maximumRequests) {
    // Drop request
    return false;
  }

  // Add request id to last window
  const zAddOptions: ZAddOptions = {
    score: Date.now() / 1000,
    value: uniqueRequestID,
  };
  await redisClient.zAdd(userID, zAddOptions);

  // Handle request
  return true;

  // Optionally, you can remove all expired request ids at regular intervals using ZRemRangeByScore
  // await redisClient.zRemRangeByScore(userID, '-inf', lastWindowTime);
}

export { rateLimitUsingSlidingLogs };
