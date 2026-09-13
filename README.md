# VOCA — AI English Speaking Coach

Practice speaking English. Get instant AI feedback. Build confidence through conversation.

VOCA is an interactive web application designed to help learners improve their English speaking skills through spontaneous practice. Users select a difficulty level, receive a random topic, and speak their response. Behind the scenes, VOCA transcribes the speech and leverages the Google Gemini API to provide an in-depth, structured evaluation of their performance.

## 🚀 Live Demo

**GitHub Repository:** [https://github.com/teja3112/voca](https://github.com/teja3112/voca)

*(Deploy this repository on Vercel to get a live production URL!)*

## ✨ Features

- 🎯 **Difficulty-based speaking topics:** Beginner, Intermediate, and Advanced
- 🎲 **Topic Roulette:** Fun, randomized topic selection
- ⏱️ **Custom preparation time:** Get ready before speaking
- 🎤 **Real microphone recording:** In-browser speech capture
- 📝 **Speech-to-text transcription:** Automatic real-time transcription
- 🤖 **Gemini-powered AI evaluation:** Intelligent analysis powered by Gemini 3.6 Flash
- 📊 **Seven-category speaking assessment:** Detailed, actionable metrics
- 🧠 **Topic relevance analysis:** Strict scoring on whether the topic was actually answered
- ⏱️ **Duration-aware scoring:** Evaluates whether you used your target speaking time effectively
- ✍️ **Grammar Coach:** Specific grammar corrections based on your transcript
- 💬 **Vocabulary improvement suggestions:** Better word choices for your exact sentences
- 📈 **Local progress tracking:** Review past sessions and scores
- 🔄 **Practice Again flow:** Seamlessly start a new session
- 🛡️ **Error handling:** Graceful fallbacks for microphone denial, short transcripts, and API drops
- 🔐 **Server-side Gemini API key protection:** Safe Vercel Serverless integration

## 📊 AI Evaluation

VOCA evaluates speaking across seven distinct categories to give you a complete picture of your language skills:

### Language
- **Fluency:** Smoothness, pacing, and continuity of speech
- **Grammar:** Accuracy of tenses, sentence structures, and mechanics
- **Vocabulary:** Range, precision, and appropriateness of word choices
- **Clarity:** How understandable and clear the spoken ideas are

### Content
- **Relevance:** Did the response directly address the selected topic?
- **Structure:** Are the ideas organized logically?
- **Development:** Are the thoughts well-expanded with examples and details?

**Smart Context Awareness:**
VOCA's evaluation dynamically adapts to the selected difficulty level. Furthermore, it incorporates strict topic adherence (penalizing off-topic responses heavily in Relevance) and duration-aware scoring (adjusting Development expectations based on how much of the target time was utilized).

## 🔄 How It Works

1. **Home** - Welcome screen and entry point
2. **Setup** - Select your desired difficulty, prep time, and target speaking time
3. **Topic Roulette** - An engaging reel animation picks your topic
4. **Topic Reveal** - Your specific topic is displayed
5. **Preparation** - A countdown gives you time to organize your thoughts
6. **Speaking** - Microphone records your response while displaying remaining time
7. **AI Analysis** - The response is transcribed and sent securely to the AI backend
8. **Results** - View your 0-100 overall score, category breakdown, and personalized feedback
9. **Progress** - Track your historical performance across sessions

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4
- **Backend (Production):** Vercel Serverless Functions
- **Backend (Local):** Node.js HTTP Server
- **AI Integration:** Google Gemini API
- **Storage:** Browser LocalStorage

## 🏗️ Architecture

VOCA uses a hybrid architecture to ensure the frontend is fast and static while keeping API keys completely secure on the backend.

```text
Browser (React + Vite)
   ↓
POST /api/analyze (Contains transcript, topic, duration)
   ↓
Vercel Serverless Function (api/analyze.js)
   ↓
Google Gemini API
   ↓
AI Evaluation JSON
   ↓
Results UI
```

The `GEMINI_API_KEY` remains safely isolated on the server-side and is **never** exposed to the client browser.

## 📁 Project Structure

```text
voca/
├── api/
│   └── analyze.js         # Production Vercel Serverless Function
├── server/
│   └── index.js           # Local development Node.js API server
├── src/
│   ├── lib/               # Utility functions, Gemini API bindings, storage logic
│   ├── screens/           # React components for each step in the flow
│   ├── App.tsx            # Main application router and state
│   ├── main.tsx           # React DOM entry point
│   └── index.css          # Tailwind and global styles
├── public/                # Static public assets
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite bundler configuration (includes local API proxy)
├── tsconfig.json          # TypeScript compiler configuration
└── README.md              # Project documentation
```

## ⚙️ Local Development

To run VOCA on your local machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/teja3112/voca.git
   cd voca
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the local development server (Frontend + Backend proxy):**
   
   *(In one terminal, start the backend)*
   ```bash
   node --env-file=.env server/index.js
   ```
   
   *(In a second terminal, start Vite)*
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the localhost URL provided by Vite.
