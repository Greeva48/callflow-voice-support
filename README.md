#Hosted link : 
https://callflowvoicesupport-greeva-fse-bolna.netlify.app/

# CallFlow — AI Voice Support

CallFlow is an **AI-powered voice customer support system** that automatically calls users and resolves order-related queries in real time using an AI voice agent.

Instead of waiting on hold or navigating complex menus, users simply enter their **phone number and order ID**, and the AI agent calls them to provide instant support.

This project demonstrates how AI voice systems can automate customer service workflows.

---

# Demo Overview

1. User enters their **phone number** and **order ID**
2. The system triggers a **voice call using Bolna AI**
3. The AI agent answers order-related queries
4. The conversation transcript is displayed in real time
5. Call analytics are stored and displayed in the dashboard

---

# Tech Stack

## Frontend
- Next.js 14  
- TypeScript  
- Tailwind CSS  

## Backend
- Node.js  
- Express.js  

## AI / Voice Infrastructure
- Bolna AI (Voice Agent + Call orchestration)

## Database
- Supabase (optional)  
- In-memory storage (default for demo)

---

# Features

## AI Voice Calls
Users receive a real-time call from an AI support agent powered by Bolna AI.

## Order Lookup
The agent can fetch order information for the following demo orders:

```
ORD-001
ORD-002
ORD-003
ORD-004
ORD-005
```

## Live Call Transcript
The web interface displays the **conversation transcript in real time** while the call is active.

## Analytics Dashboard
Displays:

- Total calls  
- Active calls  
- Resolved queries  
- Call history  
- Performance metrics  

## 24/7 Support
The AI agent handles customer queries instantly with no queues.

---

# Project Structure

```
callflow-voice-support
│
├── src                # Next.js frontend
│
├── backend            # Express backend server
│
├── database           # Sample order data
│
├── public             # Static assets
│
├── package.json
└── README.md
```

---

# Prerequisites

Make sure you have:

- Node.js 18+
- A Bolna AI account
- Bolna API key
- (Optional) Supabase project

---

# Installation

Clone the repository:

```
git clone https://github.com/Greeva48/callflow-voice-support.git
cd callflow-voice-support
```

Install frontend dependencies:

```
npm install
```

Install backend dependencies:

```
cd backend
npm install
cd ..
```

---

# Environment Variables

Create a `.env` file in the **backend** folder.

Example:

```
BOLNA_API_KEY=your_api_key_here
PORT=5000
```

If using Supabase:

```
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
```

---

# Running the Application

Start the backend server:

```
cd backend
node server.js
```

Start the frontend:

```
npm run dev
```

The app will run on:

```
http://localhost:3000
```

---

# Example Workflow

1. Open the web app  
2. Enter your **phone number**  
3. Enter an **order ID**  
4. The AI agent will call your phone  
5. Ask about your order status  
6. Watch the **live transcript** update on the call page  

---

# Future Improvements

- Multi-language AI agents  
- CRM integration  
- Real order database  
- Call recordings  
- Sentiment analysis  
- Customer satisfaction scoring  

---

# Use Cases

- E-commerce order support  
- Automated customer service  
- AI voice agents for help desks  
- Call center automation  

---

# Author

**Greeva Patel**

Software Developer  
AI / ML Enthusiast  
Microsoft Learn Student Ambassador

GitHub:  
https://github.com/Greeva48

---

# License

MIT License
