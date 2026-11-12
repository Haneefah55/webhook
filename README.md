```markdown
# 🪝 HookBridge / WaaS Gateway

> A production-ready, resilient, two-sided Webhook-as-a-Service (WaaS) platform built with **NestJS**, **TypeScript**, **MongoDB**, **RabbitMQ**, and **Redis**. 

HookBridge acts as a robust middle-layer infrastructure: it securely ingests incoming events from third-party providers (e.g., Paystack, Resend, GitHub) on behalf of your users, matches and fans out those events, and reliably dispatches them as signed, retryable outgoing webhooks to your clients' endpoints.

---

## 🚀 Key Features

### 📥 1. Inbound Webhook Ingestion
- **Raw Body Capture:** Securely preserves byte-level payloads for cryptographic signature verification.
- **Fail-Fast Security Guards:** Validates provider signatures (HMAC SHA-512/256) instantly.
- **Zero-Timeout Architecture:** Immediately acknowledges requests with `200 OK` and offloads heavy processing to **RabbitMQ**.
- **Idempotency Engine:** Tracks unique event IDs in MongoDB to completely eliminate duplicate processing from provider retry storms.

### 📤 2. Outbound Webhook Delivery
- **Multi-Tenant Subscriptions:** Manage apps, client endpoint URLs, and event-type routing maps.
- **Event Fan-Out:** Automatically routes single incoming events to multiple target subscriptions.
- **HMAC SHA-256 Signing:** Signs outgoing payloads with client-specific secrets (`X-WaaS-Signature`).
- **Resilient Retries & Backoff:** Automatically handles failures with an **exponential backoff** strategy.
- **Dead-Letter Queue (DLQ):** Permanently failed jobs are moved to a DLQ for investigation.
- **Inspection & Manual Control:** Full delivery attempt logging in MongoDB with support for **manual replays/retries**.

---

## 🛠️ Tech Stack

* **Framework:** [NestJS](https://nestjs.com/) (Node.js framework using TypeScript)
* **Database:** [MongoDB (Mongoose)](https://www.mongodb.com/) for app profiles, subscriptions, and immutable delivery logs.
* **Message Broker:** [RabbitMQ](https://www.rabbitmq.com/) for asynchronous ingestion pipelines and dispatch queues.
* **Cache / State:** [Redis](https://redis.io/) for rate limiting and backoff management.

---

## 🏗️ Architecture Flow

```text
[Third-Party Providers] 
         │ (Incoming Webhook POST)
         ▼
[Ingress Gateway] ──► [Signature Check & Idempotency Lock]
         │
         ▼
[RabbitMQ: Ingress Queue]
         │
         ▼
[Event Fan-Out Engine] ──► [Matches Client Subscriptions]
         │
         ▼
[RabbitMQ: Outgress Dispatch Queue]
         │
         ▼
[Outgoing Delivery Worker] 
   ├─ HMAC SHA-256 Payload Signing
   ├─ HTTP Dispatch + Exponential Backoff Retries
   └─ Fallback to Dead-Letter Queue (DLQ)

```
## ⚙️ Getting Started
### Prerequisites
Make sure you have the following installed on your local machine:
 * Node.js (v18+ recommended)
 * Docker & Docker Compose (for running MongoDB, RabbitMQ, and Redis quickly)
### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/hook-bridge.git](https://github.com/your-username/hook-bridge.git)
cd hook-bridge

```
### 2. Environment Setup
Create a .env file in the root directory based on .env.example:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/waas_platform
RABBITMQ_URL=amqp://localhost:5672
REDIS_HOST=localhost
REDIS_PORT=6379

```
### 3. Spin Up Infrastructure via Docker Compose
Create a docker-compose.yml file if you don't have local instances running:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

```
Run the containers:
```bash
docker compose up -d

```
### 4. Run the Application
```bash
# Install dependencies
npm install

# Start development mode
npm run dev

```
## 🔌 API Endpoints Reference
### 1. Register a Client App
 * **POST** /v1/apps
 * **Body:**
   ```json
   {
     "name": "Acme Corp"
   }
   
   ```
### 2. Register an Outgoing Webhook Endpoint (Subscription)
 * **POST** /v1/subscriptions
 * **Body:**
   ```json
   {
     "appId": "65f1a2bdhe73c3d",
     "url": "[https://client-api.com/webhooks/incoming](https://client-api.com/webhooks/incoming)",
     "eventTypes": ["paystack.charge.success"],
     "secret": "whsec_client_secret_xyz"
   }
   
   ```
### 3. Ingest Incoming Webhooks (Target for Third-Party Providers)
 * **POST** /v1/ingress/:appId
 * Automatically validates headers, drops events into RabbitMQ, and triggers client dispatches asynchronously.
### 4. Inspect Delivery History
 * **GET** /v1/deliveries/:id
 * Returns status, attempts count, history logs, error messages, and response bodies.
### 5. Manual Retry
 * **POST** /v1/deliveries/:id/retry
 * Resets attempt counters, clears failure locks, and re-queues the payload for immediate dispatch.
## 🤝 Contributing
Contributions are welcome! Feel free to open issues, submit pull requests, or suggest architectural improvements.
 1. Fork the Project
 2. Create your Feature Branch (git checkout -b feature/AmazingFeature)
 3. Commit your Changes (git commit -m 'Add some AmazingFeature')
 4. Push to the Branch (git push origin feature/AmazingFeature)
 5. Open a Pull Request
## 📝 License
Distributed under the **MIT License**. See LICENSE for more information.
```

```