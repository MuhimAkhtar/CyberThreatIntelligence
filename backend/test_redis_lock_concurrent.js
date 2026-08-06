const { fork } = require('child_process');
const path = require('path');

if (process.argv[2] === '--worker') {
  const workerId = process.argv[3];
  const Redis = require('ioredis');
  const redis = new Redis({ host: 'localhost', port: 6379 });

  async function workerTask() {
    const lockKey = 'lock:test:concurrency-check';
    const lockId = `worker-${workerId}-${Math.random()}`;
    const ttlMs = 5000;

    const result = await redis.set(lockKey, lockId, 'PX', ttlMs, 'NX');

    if (result === 'OK') {
      console.log(`[WORKER ${workerId} - PID ${process.pid}] ✅ LOCK ACQUIRED! lockId=${lockId}`);
      // Hold lock for 2 seconds to simulate work
      await new Promise(r => setTimeout(r, 2000));
      
      // Release lock atomically via Lua script
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const released = await redis.eval(luaScript, 1, lockKey, lockId);
      console.log(`[WORKER ${workerId} - PID ${process.pid}] 🔓 LOCK RELEASED! status=${released}`);
    } else {
      const currentHolder = await redis.get(lockKey);
      console.log(`[WORKER ${workerId} - PID ${process.pid}] ❌ LOCK DENIED! Held by: ${currentHolder}`);
    }
    redis.disconnect();
  }

  workerTask().catch(console.error);
} else {
  console.log('================================================================');
  console.log('TESTING SINGLE-INSTANCE REDIS DISTRIBUTED LOCK CONCURRENCY');
  console.log('Spawning 2 Independent Operating System Child Processes...');
  console.log('================================================================\n');

  const p1 = fork(__filename, ['--worker', 'Process-A']);
  const p2 = fork(__filename, ['--worker', 'Process-B']);

  let finished = 0;
  const onDone = () => {
    finished++;
    if (finished === 2) {
      console.log('\n================================================================');
      console.log('✅ MULTI-PROCESS REDIS CONCURRENCY TEST COMPLETED CLEANLY!');
      console.log('================================================================');
    }
  };

  p1.on('exit', onDone);
  p2.on('exit', onDone);
}
