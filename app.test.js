const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('./app');

test('health endpoint returns healthy status', async () => {
  const server = app.listen(0, '127.0.0.1');

  try {
    await new Promise(resolve => server.once('listening', resolve));
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/health`
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'healthy' });
  } finally {
    await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve())
    );
  }
});
