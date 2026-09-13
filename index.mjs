import http from 'node:http';

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Render connection successful!');
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});