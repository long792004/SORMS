/**
 * Test script to verify the /Payment/my-invoices endpoint
 * now returns empty list for non-resident users (Staff/Admin)
 * instead of 404
 */

const http = require('http');

// Test helper for HTTP requests
function httpRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5183,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('🔍 Testing Payment API Fix\n' + '='.repeat(50));
  
  // Get admin token
  console.log('\n1️⃣  Getting Admin token...');
  try {
    const loginRes = await httpRequest('POST', '/api/Auth/login', {
      email: 'duong123@gmail.com',
      password: 'AdminPassword123!'
    });
    
    if (loginRes.status === 200 && loginRes.body.success) {
      const adminToken = loginRes.body.data.token;
      console.log(`✅ Admin login successful (User ID: ${loginRes.body.data.user.id})`);
      
      // Test the /Payment/my-invoices endpoint
      console.log(`\n2️⃣  Testing /Payment/my-invoices as Admin...`);
      const paymentRes = await httpRequest('GET', '/api/Payment/my-invoices', null, adminToken);
      
      if (paymentRes.status === 200) {
        console.log(`✅ SUCCESS: Status ${paymentRes.status} (was 404 before fix)`);
        console.log(`✅ Response: ${JSON.stringify(paymentRes.body)}`);
        console.log(`✅ Invoices count: ${paymentRes.body.data?.length || 0}`);
      } else {
        console.error(`❌ FAILED: Status ${paymentRes.status}`);
        console.error(`Response:`, paymentRes.body);
      }
    } else {
      console.error('❌ Login failed:', loginRes.body);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Test complete!\n');
}

main().catch(console.error);
