const http = require('http');

const API_BASE = 'http://localhost:5183';
const ADMIN_CREDENTIALS = [
  { email: 'admin@gmail.com', password: '123456' },
  { email: 'admin@sorms.com', password: 'Admin@123456' },
  { email: 'duong123@gmail.com', password: 'AdminPassword123!' }
];

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const url = new URL(path, API_BASE);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          // keep raw text
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function logStep(title) {
  console.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`);
}

function extractToken(loginResponse) {
  return (
    loginResponse?.body?.data?.token ||
    loginResponse?.body?.token ||
    loginResponse?.body?.data?.Token ||
    loginResponse?.body?.Token ||
    null
  );
}

function toIsoDate(value) {
  return value.toISOString().slice(0, 10);
}

function addUtcDays(base, days) {
  const dt = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt;
}

(async () => {
  const summary = {
    bookingPricing: 'NOT_RUN',
    timerWindow: 'NOT_RUN',
    paymentTransition: 'NOT_RUN',
    checkInApproval: 'NOT_RUN',
    autoCancel15m: 'NOT_RUN'
  };

  try {
    logStep('1) Seed + login admin');
    await request('POST', '/api/Auth/seed-admin');

    let adminToken = null;
    let adminLogin = null;
    for (const cred of ADMIN_CREDENTIALS) {
      adminLogin = await request('POST', '/api/Auth/login', {
        email: cred.email,
        password: cred.password
      });
      adminToken = extractToken(adminLogin);
      if (adminLogin.status === 200 && adminToken) {
        console.log(`✅ Admin login OK with ${cred.email}`);
        break;
      }
    }
    if (!adminToken) {
      throw new Error(`Admin login failed for all known credentials. Last response: ${adminLogin?.status} ${JSON.stringify(adminLogin?.body)}`);
    }

    logStep('2) Create/login resident test account');
    const stamp = Date.now();
    const residentEmail = `resident.e2e.${stamp}@mail.com`;
    const residentUserName = `resident_e2e_${stamp}`;
    const residentPassword = 'Resident123!';

    const registerRes = await request('POST', '/api/Auth/register', {
      email: residentEmail,
      userName: residentUserName,
      password: residentPassword,
      roleId: 3,
      fullName: 'Resident E2E',
      phone: '0900000000',
      identityNumber: `ID${stamp}`
    });

    if (![200, 201].includes(registerRes.status)) {
      throw new Error(`Resident register failed: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
    }

    let residentToken = extractToken(registerRes);
    if (!residentToken) {
      const residentLogin = await request('POST', '/api/Auth/login', {
        email: residentEmail,
        password: residentPassword
      });
      residentToken = extractToken(residentLogin);
      if (residentLogin.status !== 200 || !residentToken) {
        throw new Error(`Resident login failed: ${residentLogin.status} ${JSON.stringify(residentLogin.body)}`);
      }
    }
    console.log('✅ Resident account ready');

    const nowUtc = new Date();
    const scheduledCheckIn = addUtcDays(nowUtc, 7);
    const scheduledCheckOut = addUtcDays(nowUtc, 12);
    const scheduledCheckInText = toIsoDate(scheduledCheckIn);
    const scheduledCheckOutText = toIsoDate(scheduledCheckOut);
    const nights = Math.max(1, Math.round((scheduledCheckOut.getTime() - scheduledCheckIn.getTime()) / (24 * 60 * 60 * 1000)));

    logStep(`3) Resolve room for scheduled booking (${scheduledCheckInText} -> ${scheduledCheckOutText})`);
    const availableRes = await request('GET', `/api/Room/available?checkIn=${scheduledCheckInText}&checkOut=${scheduledCheckOutText}`);
    let availableRooms = [];
    if (availableRes.status === 200 && Array.isArray(availableRes.body)) {
      availableRooms = availableRes.body;
    }

    let room = availableRooms.find((r) => String(r.roomNumber) === '503');
    if (!room) {
      room = availableRooms.find((r) => String(r.status).toLowerCase() === 'available');
    }

    if (!room) {
      const allRoomsRes = await request('GET', '/api/Room');
      const allRooms = Array.isArray(allRoomsRes.body) ? allRoomsRes.body : [];
      room = allRooms.find((r) => String(r.status).toLowerCase() === 'available');
    }

    if (!room) {
      const tempRoomNumber = `E2E-S-${String(stamp).slice(-6)}`;
      const createTempRoomRes = await request('POST', '/api/Room', {
        roomNumber: tempRoomNumber,
        roomType: 'Single',
        type: 'Single',
        floor: 98,
        monthlyRent: 6000,
        area: 20,
        maxCapacity: 2,
        status: 'Available',
        description: 'Temporary room for E2E scheduled booking flow',
        imageUrls: [],
        amenities: ['WiFi']
      }, adminToken);

      if ([200, 201].includes(createTempRoomRes.status)) {
        room = createTempRoomRes.body?.data ?? createTempRoomRes.body;
        console.log(`Created temporary room ${room?.roomNumber ?? tempRoomNumber} for step 3`);
      }
    }

    if (!room) {
      throw new Error('No available room found for test, and failed to create temporary room.');
    }

    const roomId = Number(room.id);
    const roomNumber = String(room.roomNumber ?? room.id);
    const roomCapacity = Math.max(1, Number(room.maxCapacity ?? 1));
    const bookingResidents = Math.min(3, roomCapacity);
    const monthlyRent = Number(room.monthlyRent ?? room.price ?? 0);
    const dailyRate = Math.round(monthlyRent / 30);
    const expectedAmount = dailyRate * nights;
    const expectedTotal = Number((expectedAmount * 1.15).toFixed(2));

    console.log(`Room selected: ${roomNumber} (ID=${roomId})`);
    console.log(`Room capacity=${roomCapacity}, residents used=${bookingResidents}`);
    console.log(`Expected: daily=${dailyRate}, nights=${nights}, subtotal=${expectedAmount}, total≈${expectedTotal}`);

    logStep('4) Create booking/check-in request (Resident)');
    const createCheckInRes = await request('POST', '/api/CheckIn/request-checkin', {
      roomId,
      checkInDate: `${scheduledCheckInText}T00:00:00Z`,
      checkOutDate: `${scheduledCheckOutText}T00:00:00Z`,
      numberOfResidents: bookingResidents,
      bookerFullName: 'Resident E2E',
      bookerPhone: '0900000000',
      bookerIdentityNumber: `ID${stamp}`,
      guestList: JSON.stringify([
        { fullName: 'Resident E2E', phone: '0900000000', identityNumber: `ID${stamp}` },
        ...(bookingResidents >= 2 ? [{ fullName: 'Guest 2', phone: '0900000001' }] : []),
        ...(bookingResidents >= 3 ? [{ fullName: 'Guest 3', phone: '0900000002' }] : [])
      ]),
      bedPreference: 'Double Bed',
      smokingPreference: 'Non-smoking',
      earlyCheckInRequested: false,
      checkInTime: null,
      checkOutTime: null
    }, residentToken);

    if (createCheckInRes.status !== 200 || createCheckInRes.body?.success === false) {
      throw new Error(`Create check-in failed: ${createCheckInRes.status} ${JSON.stringify(createCheckInRes.body)}`);
    }
    console.log('✅ Booking/check-in request created');

    logStep('5) Verify invoice pricing and 15-minute hold window');
    const invoicesRes = await request('GET', '/api/Payment/my-invoices', null, residentToken);
    if (invoicesRes.status !== 200 || invoicesRes.body?.success === false) {
      throw new Error(`Get my invoices failed: ${invoicesRes.status} ${JSON.stringify(invoicesRes.body)}`);
    }

    const invoices = Array.isArray(invoicesRes.body?.data) ? invoicesRes.body.data : [];
    const invoice = invoices.find((i) => String(i.roomId) === String(roomId) && ['Pending', 'Created', 'AwaitingHotelPayment'].includes(String(i.status)));
    if (!invoice) {
      throw new Error(`No pending invoice found after booking. Invoices: ${JSON.stringify(invoices.slice(0, 3))}`);
    }

    const invoiceDetailRes = await request('GET', `/api/Payment/invoice/${invoice.id}`, null, residentToken);
    const invoiceDetail = invoiceDetailRes.body?.data ?? {};
    const amount = Number(invoiceDetail.originalAmount ?? invoiceDetail.amount ?? 0);
    const total = Number(invoiceDetail.totalAmount ?? invoiceDetail.amount ?? 0);
    const holdExpiresAt = invoice.expirationTime ?? invoice.expiredAt ?? invoice.holdExpiresAt ?? null;

    const amountOk = amount === expectedAmount;
    const totalOk = total === expectedTotal;
    summary.bookingPricing = amountOk && totalOk ? 'PASS' : 'FAIL';

    console.log(`Invoice #${invoice.id} status=${invoice.status}`);
    console.log(`Subtotal amount=${amount} (expected ${expectedAmount})`);
    console.log(`Total amount=${total} (expected ${expectedTotal})`);

    if (holdExpiresAt) {
      const diffMinutes = (new Date(holdExpiresAt).getTime() - Date.now()) / 60000;
      console.log(`Hold expires at: ${holdExpiresAt} (remaining ~${diffMinutes.toFixed(2)} min)`);
      summary.timerWindow = diffMinutes > 13 && diffMinutes <= 16 ? 'PASS' : 'FAIL';
    } else {
      console.log('Hold expiry missing on invoice payload');
      summary.timerWindow = 'FAIL';
    }

    logStep('6) Create PayOS link and force paid transition (Admin mark-paid)');
    const createLinkRes = await request('POST', `/api/Payment/create-payment-link/${invoice.id}`, {
      returnUrl: 'http://localhost:5173/checkout',
      cancelUrl: 'http://localhost:5173/rooms'
    }, residentToken);

    if (![200, 400].includes(createLinkRes.status)) {
      console.log(`Unexpected create-link response: ${createLinkRes.status} ${JSON.stringify(createLinkRes.body)}`);
    } else {
      console.log(`Create payment link response status: ${createLinkRes.status}`);
    }

    const markPaidRes = await request('POST', `/api/Payment/mark-paid/${invoice.id}`, null, adminToken);
    if (markPaidRes.status === 200 && markPaidRes.body?.success !== false) {
      const paymentStatusRes = await request('GET', `/api/Payment/payment-status/${invoice.id}`, null, residentToken);
      const currentStatus = String(paymentStatusRes.body?.data?.status ?? '');
      summary.paymentTransition = currentStatus === 'Paid' ? 'PASS' : 'FAIL';
      console.log(`Payment status after mark-paid: ${currentStatus || 'UNKNOWN'}`);
    } else {
      summary.paymentTransition = 'FAIL';
      console.log(`Mark-paid failed: ${markPaidRes.status} ${JSON.stringify(markPaidRes.body)}`);
    }

    logStep('7) Validate check-in timing guard for scheduled booking');
    const pendingCheckInRes = await request('GET', '/api/CheckIn/pending-checkin', null, adminToken);
    const pendingList = Array.isArray(pendingCheckInRes.body?.data) ? pendingCheckInRes.body.data : [];

    const targetRequest = pendingList.find((r) => String(r.roomId) === String(roomId));
    if (!targetRequest) {
      summary.checkInApproval = 'FAIL';
      console.log('No pending check-in request found for room.');
    } else {
      const approveRes = await request('POST', '/api/CheckIn/approve-checkin', {
        requestId: Number(targetRequest.id),
        isApproved: true,
        rejectReason: null
      }, adminToken);

      if (approveRes.status === 400 && String(approveRes.body?.message ?? '').includes('Chưa đến thời gian check-in')) {
        console.log('✅ Timing guard works: cannot approve check-in before booked time.');
      } else {
        console.log(`Timing-guard response: ${approveRes.status} ${JSON.stringify(approveRes.body)}`);
      }
    }

    logStep('8) Full check-in success path (eligible time + identity verified)');
    const now = new Date();
    const checkInEligible = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const checkOutEligible = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2));
    const fmt = (d) => d.toISOString().slice(0, 10);

    const allRoomsRes = await request('GET', '/api/Room');
    const allRooms = Array.isArray(allRoomsRes.body) ? allRoomsRes.body : [];
    let eligibleRoom = allRooms.find((r) => String(r.status).toLowerCase() === 'available' && Number(r.id) !== roomId)
      || allRooms.find((r) => String(r.status).toLowerCase() === 'available');

    if (!eligibleRoom) {
      const tempRoomNumber = `E2E-${String(stamp).slice(-6)}`;
      const createTempRoomRes = await request('POST', '/api/Room', {
        roomNumber: tempRoomNumber,
        roomType: 'Single',
        type: 'Single',
        floor: 99,
        monthlyRent: 3000,
        area: 18,
        maxCapacity: 1,
        status: 'Available',
        description: 'Temporary room for E2E check-in approval flow',
        imageUrls: [],
        amenities: ['WiFi']
      }, adminToken);

      if ([200, 201].includes(createTempRoomRes.status)) {
        eligibleRoom = createTempRoomRes.body?.data ?? createTempRoomRes.body;
        console.log(`Created temporary room ${eligibleRoom?.roomNumber ?? tempRoomNumber} for step 8`);
      }
    }

    if (!eligibleRoom) {
      summary.checkInApproval = 'FAIL';
      console.log('No available room found and failed to create temporary room for immediate check-in success scenario.');
    } else {
      const eligibleRoomId = Number(eligibleRoom.id ?? eligibleRoom.roomId);
      const eligibleCreateRes = await request('POST', '/api/CheckIn/request-checkin', {
        roomId: eligibleRoomId,
        checkInDate: `${fmt(checkInEligible)}T00:00:00Z`,
        checkOutDate: `${fmt(checkOutEligible)}T00:00:00Z`,
        numberOfResidents: 1,
        bookerFullName: 'Resident E2E',
        bookerPhone: '0900000000',
        bedPreference: 'Double Bed',
        smokingPreference: 'Non-smoking',
        earlyCheckInRequested: false,
        checkInTime: null,
        checkOutTime: null
      }, residentToken);

      if (eligibleCreateRes.status !== 200 || eligibleCreateRes.body?.success === false) {
        summary.checkInApproval = 'FAIL';
        console.log(`Eligible check-in create failed: ${eligibleCreateRes.status} ${JSON.stringify(eligibleCreateRes.body)}`);
      } else {
        const invoices2Res = await request('GET', '/api/Payment/my-invoices', null, residentToken);
        const invoices2 = Array.isArray(invoices2Res.body?.data) ? invoices2Res.body.data : [];
        const eligibleInvoice = invoices2.find((i) => String(i.roomId) === String(eligibleRoomId) && ['Pending', 'Created', 'AwaitingHotelPayment'].includes(String(i.status)));

        if (!eligibleInvoice) {
          summary.checkInApproval = 'FAIL';
          console.log('Eligible flow invoice not found.');
        } else {
          await request('POST', `/api/Payment/mark-paid/${eligibleInvoice.id}`, null, adminToken);

          const myProfileRes = await request('GET', '/api/Resident/my-profile', null, residentToken);
          const residentId = Number(myProfileRes.body?.data?.id ?? myProfileRes.body?.id ?? 0);
          if (residentId > 0) {
            await request('POST', '/api/Resident/verify-identity', {
              residentId,
              isVerified: true,
              identityDocumentUrl: 'https://example.com/e2e-id.png'
            }, adminToken);
          }

          const pending2Res = await request('GET', '/api/CheckIn/pending-checkin', null, adminToken);
          const pending2 = Array.isArray(pending2Res.body?.data) ? pending2Res.body.data : [];
          const req2 = pending2.find((r) => String(r.roomId) === String(eligibleRoomId));

          if (!req2) {
            summary.checkInApproval = 'FAIL';
            console.log('Eligible pending check-in request not found for approval.');
          } else {
            const approve2 = await request('POST', '/api/CheckIn/approve-checkin', {
              requestId: Number(req2.id),
              isApproved: true,
              rejectReason: null
            }, adminToken);

            const status2Res = await request('GET', '/api/CheckIn/my-status', null, residentToken);
            const status2 = String(status2Res.body?.data?.status ?? status2Res.body?.status ?? '');

            summary.checkInApproval = approve2.status === 200 && status2.toLowerCase().includes('checkedin') ? 'PASS' : 'FAIL';
            console.log(`Eligible flow approve status=${approve2.status}, resident status=${status2 || 'UNKNOWN'}`);
          }
        }
      }
    }

    // Auto-cancel 15m cannot be completed in a short deterministic run without waiting full hold window.
    summary.autoCancel15m = 'MANUAL_WAIT_REQUIRED';

    logStep('FINAL SUMMARY');
    console.log(summary);

    const allCorePassed =
      summary.bookingPricing === 'PASS' &&
      summary.timerWindow === 'PASS' &&
      summary.paymentTransition === 'PASS' &&
      summary.checkInApproval === 'PASS';

    if (!allCorePassed) {
      process.exitCode = 2;
    }
  } catch (error) {
    console.error('\n❌ E2E test failed with exception:');
    console.error(error.message || error);
    process.exitCode = 1;
  }
})();
