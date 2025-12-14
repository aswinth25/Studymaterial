# Quick Setup Guide

## Option 1: View Demo (No Installation Required)

Simply open `demo.html` in your web browser to see the UI. Note: AI features won't work in this demo.

## Option 2: Full Setup (With AI Features)

### Step 1: Install Node.js
1. Download Node.js from https://nodejs.org/
2. Install it (choose the LTS version)
3. **Restart your terminal/PowerShell** after installation

### Step 2: Verify Installation
Open a new terminal and run:
```bash
node --version
npm --version
```
Both commands should show version numbers.

### Step 3: Install Dependencies
In your project folder, run:
```bash
npm install
```

### Step 4: Set Up Gemini API Key
1. Create an API key from https://aistudio.google.com/app/apikey
2. Create a file named `.env` in the project root
3. Add this line to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### Step 5: Run the App

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Step 6: Open in Browser
Go to: http://localhost:5173

## Troubleshooting

**Blank screen when opening index.html directly?**
- React apps need to run through a dev server
- Use `npm run dev` instead of opening the HTML file directly

**"node is not recognized" error?**
- Node.js is not installed or not in your PATH
- Reinstall Node.js and restart your terminal

**"npm is not recognized" error?**
- Node.js is not installed (npm comes with Node.js)
- Install Node.js from nodejs.org

