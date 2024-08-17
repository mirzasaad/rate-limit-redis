// RateLimitUsingTokenBucket .
func RateLimitUsingTokenBucket(userID string, intervalInSeconds int64, maximumRequests int64) bool {
	// userID can be apikey, location, ip
	value, _ := redisClient.Get(ctx, userID+"_last_reset_time").Result()
	lastResetTime, _ := strconv.ParseInt(value, 10, 64)
	// if the key is not available, i.e., this is the first request, lastResetTime will be set to 0 and counter be set to max requests allowed
	// check if time window since last counter reset has elapsed
	if time.Now().Unix()-lastResetTime >= intervalInSeconds {
		// if elapsed, reset the counter
		redisClient.Set(ctx, userID+"_counter", strconv.FormatInt(maximumRequests, 10), 0)
	} else {
		value, _ := redisClient.Get(ctx, userID+"_counter").Result()
		requestLeft, _ := strconv.ParseInt(value, 10, 64)
		if requestLeft <= 0 { // request left is 0 or < 0
			// drop request
			return false
		}
	}

	// decrement request count by 1
	redisClient.Decr(ctx, userID+"_counter")

	// handle request
	return true
}