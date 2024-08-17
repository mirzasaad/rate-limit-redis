import { Redis } from "ioredis";

const redisClient = new Redis();

async function rateLimitUsingLeakyBucket(
  userID: string,
  uniqueRequestID: string,
  intervalInSeconds: number,
  maximumRequests: number
): Promise<boolean> {
  // userID can be apikey, location, ip
  const requestCount = await redisClient.llen(userID);

  if (requestCount >= maximumRequests) {
    // drop request
    return false;
  }

  // add request id to the end of the queue
  await redisClient.rpush(userID, uniqueRequestID);

  // handle request
  return true;
}
