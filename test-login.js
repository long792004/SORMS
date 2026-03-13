const http = require('http');

const data = JSON.stringify({ email: 'duong123@gmail.com', password: 'AdminPassword123!' });

const options = {
  hostname: 'localhost',
  port: 5183,
  path: '/api/Auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
