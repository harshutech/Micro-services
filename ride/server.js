const http = require('http');
const app = require('./app');
const port = process.env.PORT || 3003;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`ride service running on port ${port}`);
});