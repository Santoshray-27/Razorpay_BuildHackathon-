# RazorRecover API Documentation

## Webhook Ingestion (`/api/webhooks`)

### 1. Razorpay Webhook Receiver
* **Endpoint:** `POST /api/webhooks/razorpay`
* **Headers:**
  * `Content-Type: application/json`
  * `x-razorpay-signature: <HMAC_SHA256_HEX>`
  * `x-razorpay-event-id: <EVENT_ID>` *(optional, computed from SHA-256 payload hash if missing)*
* **Description:** Receives and validates live or test mode webhook events directly from Razorpay. Uses route-level `express.raw()` body parser to guarantee 100% byte-accurate HMAC-SHA256 verification.
* **Idempotency:** If the same `providerEventId` is sent multiple times, RazorRecover returns `200 OK` with `{ status: "ignored_duplicate" }` and writes a `DUPLICATE_EVENT_IGNORED` audit log without creating duplicate database records or queue jobs.

#### Sample Request Body (Failed Payment):
```json
{
  "entity": "event",
  "account_id": "acc_demo_merchant",
  "event": "payment.failed",
  "contains": ["payment"],
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_test_001",
        "entity": "payment",
        "amount": 499900,
        "currency": "INR",
        "status": "failed",
        "order_id": "order_test_001",
        "method": "card",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Payment failed due to insufficient funds",
        "error_reason": "insufficient_funds",
        "customer_id": "cust_test_001",
        "email": "rahul.kumar@example.com",
        "contact": "+919876543210",
        "created_at": 1725100000
      }
    }
  },
  "created_at": 1725100000
}
```

---

### 2. Local Development & Simulator Fixture
* **Endpoint:** `POST /api/webhooks/dev-fixture`
* **Description:** Allows triggering payment failure and success workflows locally without needing an ngrok tunnel or public webhook URL.
* **Security Guard:** Blocked with `403 Forbidden` if `NODE_ENV === 'production'`.

#### Sample Payload:
```json
{
  "merchantId": "merch_demo_01",
  "event_id": "evt_dev_1001",
  "payment_id": "pay_dev_1001",
  "amount": 499900,
  "currency": "INR",
  "status": "failed",
  "failure_reason": "insufficient_funds",
  "payment_method": "card",
  "execution_mode": "MOCK_DEMO"
}
```

---

## Authentication (`/api/auth`)

* `POST /api/auth/register` — Register a merchant user.
* `POST /api/auth/login` — Authenticate and receive a signed JWT.
* `GET /api/auth/me` — Retrieve sanitized authenticated user profile (`Authorization: Bearer <token>`).

---

## Merchant Payments (`/api/payments`)

* `GET /api/payments` — List payments scoped strictly to the authenticated merchant.
* `GET /api/payments/:id` — Retrieve specific payment record with customer reference.
