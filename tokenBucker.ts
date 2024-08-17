import { RedisClientType } from "redis";
import { promisify } from "util";

async function rateLimitUsingTokenBucket(
  redisClient: RedisClientType,
  userID: string,
  intervalInSeconds: number,
  maximumRequests: number
): Promise<boolean> {
  const getAsync = promisify(redisClient.get).bind(redisClient);
  const setAsync = promisify(redisClient.set).bind(redisClient);
  const decrAsync = promisify(redisClient.decr).bind(redisClient);

  const lastResetTimeStr = await getAsync(`${userID}_last_reset_time`);
  const lastResetTime = lastResetTimeStr ? parseInt(lastResetTimeStr, 10) : 0;

  const currentTime = Math.floor(Date.now() / 1000);

  if (currentTime - lastResetTime >= intervalInSeconds) {
    // Reset the counter
    await setAsync(`${userID}_counter`, maximumRequests.toString());
    await setAsync(`${userID}_last_reset_time`, currentTime.toString());
  } else {
    const requestLeftStr = await getAsync(`${userID}_counter`);
    const requestLeft = requestLeftStr
      ? parseInt(requestLeftStr, 10)
      : maximumRequests;

    if (requestLeft <= 0) {
      // Drop request
      return false;
    }
  }

  // Decrement request count by 1
  await decrAsync(`${userID}_counter`);

  // Handle request
  return true;
}
