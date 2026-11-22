/**
 * RAG Core Engine
 * Handles vector representation, cosine similarity retrieval, prompt construction,
 * and LLM provider execution with strict grounding.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const knowledgeBasePath = path.resolve(__dirname, '../data/knowledgeBase.json');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'i', 'my', 'her', 'she', 'this', 'that', 'these', 'those',
  'what', 'how', 'when', 'where', 'which', 'who', 'tell', 'me', 'show'
]);

let cachedKnowledgeBase = null;

export function getKnowledgeBase() {
  if (cachedKnowledgeBase) return cachedKnowledgeBase;
  if (!fs.existsSync(knowledgeBasePath)) {
    throw new Error('Knowledge base not found. Please run `npm run build:rag` first.');
  }
  const raw = fs.readFileSync(knowledgeBasePath, 'utf-8');
  cachedKnowledgeBase = JSON.parse(raw);
  return cachedKnowledgeBase;
}

function stem(word) {
  if (word.length <= 3) return word;
  return word.replace(/(ing|tions|tion|ies|es|ed|s)$/, '');
}

export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-_]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token))
    .map(token => stem(token));
}

export function vectorizeQuery(queryTokens, df, totalDocs) {
  const tf = {};
  if (queryTokens.length === 0) return { vector: {}, magnitude: 0 };

  for (const token of queryTokens) {
    tf[token] = (tf[token] || 0) + 1;
  }

  const vector = {};
  let magnitudeSq = 0;

  for (const term in tf) {
    const termTf = tf[term] / queryTokens.length;
    const docFreq = df[term] || 0;
    const idf = Math.log((totalDocs + 1) / (docFreq + 1)) + 1;
    const weight = termTf * idf;
    vector[term] = weight;
    magnitudeSq += weight * weight;
  }

  return {
    vector,
    magnitude: Math.sqrt(magnitudeSq)
  };
}

export function cosineSimilarity(vecA, magA, vecB, magB) {
  if (magA === 0 || magB === 0) return 0;
  let dotProduct = 0;
  // Iterate through smaller vector
  const [smaller, larger] = Object.keys(vecA).length < Object.keys(vecB).length
    ? [vecA, vecB]
    : [vecB, vecA];

  for (const term in smaller) {
    if (larger[term]) {
      dotProduct += smaller[term] * larger[term];
    }
  }

  return dotProduct / (magA * magB);
}

/**
 * Retrieve Top-K most relevant chunks using vector cosine similarity
 */
export function retrieveContext(query, topK = 4, minThreshold = 0.04) {
  const kb = getKnowledgeBase();
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  const { vector: qVec, magnitude: qMag } = vectorizeQuery(queryTokens, kb.df, kb.totalChunks);

  const scored = kb.chunks.map(chunk => {
    const similarity = cosineSimilarity(qVec, qMag, chunk.vector, chunk.vectorMagnitude);
    return {
      id: chunk.id,
      type: chunk.type,
      title: chunk.title,
      link: chunk.link,
      content: chunk.content,
      score: similarity
    };
  });

  // Sort descending by similarity
  scored.sort((a, b) => b.score - a.score);

  // Return top chunks above threshold
  const results = scored.filter(item => item.score >= minThreshold).slice(0, topK);

  // If top scores are too low, fall back to top 2 if they have any term overlap
  if (results.length === 0 && scored.length > 0 && scored[0].score > 0) {
    return scored.slice(0, 2);
  }

  return results;
}

/**
 * Strict Grounded System Prompt
 */
export const SYSTEM_PROMPT = `You are ASTRA, the grounded AI assistant for Rafia Gull's portfolio.
Rafia Gull is an aspiring game developer and Computer Science student specializing in Gaming and Animation at NED University in Karachi, Pakistan.

CRITICAL INSTRUCTIONS:
1. Answer the visitor's question using ONLY the provided verified context excerpts below.
2. If the answer cannot be determined strictly and truthfully from the context, respond with:
   "The available portfolio information does not specify this."
3. Do NOT guess, assume, or invent personal facts, emails, dates, grades, employers, awards, or external links.
4. Keep answers concise, factual, and professional. Format with Markdown where appropriate.`;

/**
 * Call Language Model (OpenAI or Gemini) or return formatted grounded fallback
 */
export async function generateRAGAnswer(question, chunks) {
  const sources = chunks.map(c => ({
    id: c.id,
    title: c.title,
    type: c.type,
    link: c.link
  }));

  if (chunks.length === 0) {
    return {
      answer: "The available portfolio information does not specify this. You can ask about Rafia's game development projects (VR Games Hub, Eat Right Run, The Parallel Eclipse), her studies at NED University, CEGA certifications, or technical skills in Unity, Unreal Engine, C++, and Python.",
      sources: [],
      isGrounded: true,
      provider: "none"
    };
  }

  const contextText = chunks.map((c, i) => `[Source ${i + 1}: ${c.title}]\n${c.content}`).join('\n\n');
  const userPrompt = `VERIFIED CONTEXT:\n${contextText}\n\nQUESTION: ${question}\n\nANSWER:`;

  // 1. Try OpenAI if configured
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 350
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content?.trim() || 'No answer generated.';
      return {
        answer,
        sources,
        isGrounded: true,
        provider: `OpenAI (${model})`
      };
    } catch (err) {
      console.warn('OpenAI call failed, falling back to Gemini or grounded retrieval:', err.message);
    }
  }

  // 2. Try Gemini if configured
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [
            {
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 350
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API error:', response.status, errText);
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No answer generated.';
      return {
        answer,
        sources,
        isGrounded: true,
        provider: `Gemini (${model})`
      };
    } catch (err) {
      console.warn('Gemini call failed:', err.message);
    }
  }

  // 3. Fallback when server credentials are not configured:
  // Return the verified context excerpts directly with transparent notice
  const bulletPoints = chunks.map(c => `• **${c.title}**:\n${c.content.split('\n').slice(0, 3).join('\n')}`).join('\n\n');
  const fallbackAnswer = `*(Server LLM key not configured. Displaying verified portfolio excerpts retrieved by vector search)*:\n\n${bulletPoints}`;

  return {
    answer: fallbackAnswer,
    sources,
    isGrounded: true,
    provider: 'Local Vector Retrieval (No API key set)'
  };
}
