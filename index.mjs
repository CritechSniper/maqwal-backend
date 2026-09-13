import http from 'node:http';

const port = process.env.PORT || 3000;

// 1. Basic HTTP Server to satisfy Render's port requirement
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is active and pinging itself!');
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);

  // 2. Self-Pinger: Runs every 10 minutes (600,000 ms)
  const PING_INTERVAL = 10 * 60 * 1000; 

  setInterval(() => {
    // Render provides RENDER_EXTERNAL_URL automatically in environment variables
    const siteUrl = process.env.RENDER_EXTERNAL_URL;

    if (siteUrl) {
      http.get(siteUrl, (res) => {
        console.log(`[Pinger] Self-ping status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('[Pinger] Self-ping failed:', err.message);
      });
    } else {
      console.log('[Pinger] RENDER_EXTERNAL_URL not detected (likely running locally).');
    }
  }, PING_INTERVAL);
});