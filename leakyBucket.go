// RateLimitUsingLeakyBucket .
func RateLimitUsingLeakyBucket(userID string, uniqueRequestID string, intervalInSeconds int64, maximumRequests int64) bool {
	// userID can be apikey, location, ip
	requestCount := redisClient.LLen(ctx, userID).Val()
	if requestCount >= maximumRequests {
		// drop request
		return false
	}

	// add request id to the end of queue
	redisClient.RPush(ctx, userID, uniqueRequestID)

	// handle request
	return true
}