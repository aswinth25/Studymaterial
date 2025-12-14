// This is a simple Express server example
// You'll need to install express: npm install express
// Run with: node src/api/server.js
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file from project root (two levels up from src/api/)
dotenv.config({ path: join(__dirname, '../../.env') })

const app = express()
app.use(cors())
app.use(express.json())

// Optional Gemini key (if missing, chat/quiz will return a helpful error but server still runs)
const hasGeminiKey = !!process.env.GEMINI_API_KEY
const geminiApiKey = hasGeminiKey ? process.env.GEMINI_API_KEY.trim() : null
const genAI = hasGeminiKey ? new GoogleGenerativeAI(geminiApiKey) : null
const STUDY_CHAT_PROMPT =
  'You are a helpful AI study partner. Provide clear, educational explanations to help students learn. Be concise but thorough.'
const QUIZ_INSTRUCTIONS =
  'You are a quiz generator. Generate exactly 5 multiple-choice questions with 4 options each. Respond ONLY with valid JSON in this exact format: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]} where correctAnswer is the index (0-3) of the correct option.'

function buildConversation(messages, includePrompt = true) {
  const conversation = []

  if (includePrompt) {
    conversation.push({
      role: 'user',
      parts: [{ text: STUDY_CHAT_PROMPT }],
    })
  }

  messages.forEach((message) => {
    if (!message?.content) return
    const role = message.role === 'assistant' ? 'model' : 'user'
    conversation.push({
      role,
      parts: [{ text: message.content }],
    })
  })

  return conversation
}

function createErrorMessage(error) {
  const errorMessage = error?.message || 'Gemini API request failed.'
  const lower = errorMessage.toLowerCase()

  if (lower.includes('permission') || lower.includes('unauthorized') || lower.includes('api key')) {
    return 'Invalid Gemini API key. Please update GEMINI_API_KEY in your .env file from https://aistudio.google.com/app/apikey'
  }

  if (lower.includes('quota') || lower.includes('billing') || lower.includes('exceeded')) {
    return 'Gemini API quota exceeded. Please review your Google AI Studio usage and billing.'
  }

  if (lower.includes('rate limit')) {
    return 'Gemini rate limit reached. Please wait a moment and try again.'
  }

  return errorMessage
}

function buildSearchErrorMessage(error) {
  const message = error?.message || 'Search request failed.'
  const lower = message.toLowerCase()

  if (lower.includes('permission') || lower.includes('api key')) {
    return 'Invalid Google Search API credentials. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX in your .env.'
  }
  if (lower.includes('daily') || lower.includes('limit') || lower.includes('quota')) {
    return 'Search quota exceeded. Check your Google Programmable Search quotas.'
  }

  return message
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  if (!hasGeminiKey) {
    return res.status(503).json({
      error: 'Gemini is not configured',
      details: 'Add GEMINI_API_KEY to your .env to enable chat.',
    })
  }

  try {
    const { messages } = req.body

    const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' })
    const result = await chatModel.generateContent({
      contents: buildConversation(messages),
    })

    res.json({ response: result.response.text() })
  } catch (error) {
    console.error('Error:', error)
    console.error('Error details:', error.message)
    const userFriendlyMessage = createErrorMessage(error)
    res.status(500).json({ 
      error: 'Failed to get response from Gemini',
      details: userFriendlyMessage
    })
  }
})

// Web search endpoint using Wikipedia Search API (no API key needed)
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').toString().trim()

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter q' })
  }

  if (!hasGeminiKey) {
    return res.status(503).json({
      error: 'Gemini is not configured',
      details: 'Add GEMINI_API_KEY to your .env to enable quiz generation.',
    })
  }

  try {
    const url = new URL('https://en.wikipedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('list', 'search')
    url.searchParams.set('srsearch', query)
    url.searchParams.set('format', 'json')

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Search request failed')
    }

    const results =
      data?.query?.search?.map((item) => ({
        title: item.title,
        link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
        snippet: item.snippet ? item.snippet.replace(/<\/?span[^>]*>/g, '') : '',
      })) || []

    res.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({
      error: 'Failed to perform search',
      details: error?.message || 'Search request failed',
    })
  }
})

// Quiz generation endpoint
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { topic } = req.body

    const quizModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro-latest',
      generationConfig: { responseMimeType: 'application/json' },
    })

    const quizPrompt = `${QUIZ_INSTRUCTIONS}\n\nTopic: ${topic}\n\nRemember: respond with raw JSON only.`

    const result = await quizModel.generateContent(quizPrompt)

    const quizData = JSON.parse(result.response.text())
    res.json(quizData)
  } catch (error) {
    console.error('Error:', error)
    console.error('Error details:', error.message)
    const userFriendlyMessage = createErrorMessage(error)
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      details: userFriendlyMessage
    })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

