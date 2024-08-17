import Redis from "ioredis";

const redisClient = new Redis(); // Initialize your Redis client

interface Context {
  // Define the context object based on your application's requirements
}

async function rateLimitUsingSlidingWindow(
  ctx: Context,
  userID: string,
  uniqueRequestID: string,
  intervalInSeconds: number,
  maximumRequests: number
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000); // Get current time in seconds

  const currentWindow = Math.floor(now / intervalInSeconds).toString();
  const currentWindowKey = `${userID}:${currentWindow}`;

  // Get current window count
  const valueCurrentWindow = await redisClient.get(currentWindowKey);
  const requestCountCurrentWindow = valueCurrentWindow
    ? parseInt(valueCurrentWindow, 10)
    : 0;

  if (requestCountCurrentWindow >= maximumRequests) {
    // Drop request
    return false;
  }

  const lastWindow = Math.floor(
    (now - intervalInSeconds) / intervalInSeconds
  ).toString();
  const lastWindowKey = `${userID}:${lastWindow}`;

  // Get last window count
  const valueLastWindow = await redisClient.get(lastWindowKey);
  const requestCountLastWindow = valueLastWindow
    ? parseInt(valueLastWindow, 10)
    : 0;

  const elapsedTimePercentage = (now % intervalInSeconds) / intervalInSeconds;

  // Last window weighted count + current window count
  const weightedRequestCount =
    requestCountLastWindow * (1 - elapsedTimePercentage) +
    requestCountCurrentWindow;
  if (weightedRequestCount >= maximumRequests) {
    // Drop request
    return false;
  }

  // Increment request count by 1 in the current window
  await redisClient.incr(currentWindowKey);

  // Handle request
  return true;
}
