const express = require('express');
const expressProxy = require('express-http-proxy');
const app = express();



app.use('/user', expressProxy('http://localhost:3001')); // User service 
app.use('/captain', expressProxy('http://localhost:3002')); // Captain service
app.use('/ride', expressProxy('http://localhost:3003')); // Ride service





app.listen(3000, () => {
  console.log('API Gateway listening on port 3000');
});