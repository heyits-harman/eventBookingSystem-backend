import Redis from 'ioredis'

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  console.log("Redis not connected: ", err.message);
})

redis.on('connect', () => {
  console.log("Redis is connected");
})

export default redis;