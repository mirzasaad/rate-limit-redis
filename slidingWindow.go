func RateLimitUsingSlidingWindow(userID string, uniqueRequestID string, intervalInSeconds int64, maximumRequests int64) bool {
	// userID can be apikey, location, ip
	now := time.Now().Unix()

	currentWindow := strconv.FormatInt(now/intervalInSeconds, 10)
	key := userID + ":" + currentWindow // user userID + current time window
	// get current window count
	value, _ := redisClient.Get(ctx, key).Result()
	requestCountCurrentWindow, _ := strconv.ParseInt(value, 10, 64)
	if requestCountCurrentWindow >= maximumRequests {
		// drop request
		return false
	}

	lastWindow := strconv.FormatInt(((now - intervalInSeconds) / intervalInSeconds), 10)
	key = userID + ":" + lastWindow // user userID + last time window
	// get last window count
	value, _ = redisClient.Get(ctx, key).Result()
	requestCountlastWindow, _ := strconv.ParseInt(value, 10, 64)

	elapsedTimePercentage := float64(now%intervalInSeconds) / float64(intervalInSeconds)

	// last window weighted count + current window count
	if (float64(requestCountlastWindow)*(1-elapsedTimePercentage))+float64(requestCountCurrentWindow) >= float64(maximumRequests) {
		// drop request
		return false
	}

	// increment request count by 1 in current window
	redisClient.Incr(ctx, userID+":"+currentWindow)

	// handle request
	return true
}