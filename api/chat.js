/**
 * Vercel Serverless Function: /api/chat
 *
 * Implements the RAG endpoint with:
 * - In-memory IP rate limiting
 * - Query input sanitization and length validation
 * - Vector retrieval from knowledgeBase.json
 * - Grounded LLM response generation
 * - Source citation labels and links
 */

import { retrieveContext, generateRAGAnswer } from './lib/rag.js';

// In-memory IP rate limiting
// Map<ip, Array<timestamp>>
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = parseInt(process.env.RATE_LIMIT_MAX_PER_MINUTE || '15', 10);
const MAX_QUERY_LENGTH = parseInt(process.env.MAX_QUERY_LENGTH || '500', 10);

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Filter out timestamps outside current window
  const activeTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, activeTimestamps);
    return true;
  }

  activeTimestamps.push(now);
  rateLimitMap.set(ip, activeTimestamps);

  // Periodically clean old keys
  if (rateLimitMap.size > 2000) {
    for (const [key, tsList] of rateLimitMap.entries()) {
      if (tsList.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitMap.delete(key);
      }
    }
  }

  return false;
}

export default async function handler(req, res) {
  // CORS & Options
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST requests are supported.'
    });
  }

  // Extract client IP (Vercel provides x-forwarded-for or x-real-ip)
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1')
    .toString()
    .split(',')[0]
    .trim();

  // Rate Limiting Check
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a moment before sending another query.'
    });
  }

  try {
    // Parse body if not already parsed
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const query = (body.query || body.message || '').trim();

    // Input Validation
    if (!query) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query text cannot be empty.'
      });
    }

    if (query.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query is too short. Please provide a descriptive question.'
      });
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters.`
      });
    }

    // Step 1: Retrieve relevant vector chunks
    const retrievedChunks = retrieveContext(query, 4);

    // Step 2: Generate grounded answer
    const result = await generateRAGAnswer(query, retrievedChunks);

    return res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      provider: result.provider,
      isGrounded: result.isGrounded
    });

  } catch (error) {
    console.error('Error handling /api/chat:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
}
