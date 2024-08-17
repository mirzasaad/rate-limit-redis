package main

import (
	"strconv"
	"time"
)

func RateLimitUsingFixedWindow(userID string, intervalInSeconds int64, maximumRequests int64) bool {
	// userID can be apikey, location, ip
	currentWindow := strconv.FormatInt(time.Now().Unix()/intervalInSeconds, 10)
	key := userID + ":" + currentWindow // user userID + current time window
	// get current window count
	value, _ := redisClient.Get(ctx, key).Result()
	requestCount, _ := strconv.ParseInt(value, 10, 64)
	if requestCount >= maximumRequests {
		// drop request
		return false
	}

	// increment request count by 1
	redisClient.Incr(ctx, key) // if the key is not available, value is initialised to 0 and incremented to 1

	// handle request
	return true
	// delete all expired keys at regular intervals
}
