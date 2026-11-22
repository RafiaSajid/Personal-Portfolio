/**
 * Build RAG Knowledge Base & Vector Index
 *
 * This script processes structured portfolio data from `src/data/portfolioData.js`,
 * chunks all records with source metadata, computes vector term weights,
 * and saves the vector store to `api/data/knowledgeBase.json`.
 *
 * Run with: npm run build:rag
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { portfolioData } from '../src/data/portfolioData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../api/data');
const outputPath = path.join(outputDir, 'knowledgeBase.json');

// Stop words for vector indexing
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'i', 'my', 'her', 'she', 'this', 'that', 'these', 'those'
]);

function stem(word) {
  if (word.length <= 3) return word;
  return word.replace(/(ing|tions|tion|ies|es|ed|s)$/, '');
}

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-_]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token))
    .map(token => stem(token));
}

function computeTermFrequency(tokens) {
  const tf = {};
  if (tokens.length === 0) return tf;
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  // Normalize
  for (const token in tf) {
    tf[token] = tf[token] / tokens.length;
  }
  return tf;
}

function buildChunks() {
  const chunks = [];

  // 1. Profile & Bio Chunk
  const profile = portfolioData.profile;
  chunks.push({
    id: 'profile-summary',
    type: 'profile',
    title: 'Rafia Gull - Profile & Summary',
    link: './about.html',
    content: [
      `Name: ${profile.name}`,
      `Role: ${profile.role}`,
      `University: ${profile.university}`,
      `Location: ${profile.location}`,
      `Summary: ${profile.summary}`,
      `Biography: ${profile.bio.join(' ')}`,
      `Email Contact: ${profile.contact.email} (placeholder until confirmed)`,
      `Location Status: ${profile.contact.location}`
    ].join('\n')
  });

  // 2. Education Chunk
  const edu = portfolioData.education;
  chunks.push({
    id: 'education-ned',
    type: 'education',
    title: 'Education - NED University',
    link: './about.html#education',
    content: [
      `University: ${edu.institution}`,
      `Institution: ${edu.institution}`,
      `Degree: ${edu.degree}`,
      `Specialization: ${edu.specialization}`,
      `Location: ${edu.location}`,
      `Academic Studies & Status: ${edu.status} (currently studying as an undergraduate student)`,
      `Overview: ${edu.summary}`
    ].join('\n')
  });

  // 3. Certifications Chunk
  if (portfolioData.certifications) {
    chunks.push({
      id: 'certifications-cega',
      type: 'certification',
      title: 'Professional Certifications (CEGA)',
      link: './about.html#certifications',
      content: portfolioData.certifications.map(c => 
        `Certification: ${c.title} certified by ${c.issuer}. Topics: ${c.topics}`
      ).join('\n')
    });
  }

  // 4. Skills Chunks (by domain)
  if (portfolioData.skills) {
    portfolioData.skills.forEach((cat, idx) => {
      chunks.push({
        id: `skills-${cat.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        type: 'skills',
        title: `Skills: ${cat.category}`,
        link: './about.html#skills',
        content: [
          `Skill Category: ${cat.category}`,
          ...cat.items.map(i => `${i.name} (${i.level}): ${i.desc}`)
        ].join('\n')
      });
    });
  }

  // 5. Project Chunks (all 7 projects)
  if (portfolioData.projects) {
    portfolioData.projects.forEach(p => {
      const parts = [
        `Project Title: ${p.title}`,
        `Category: ${p.category}`,
        `Technologies: ${p.technologies.join(', ')}`,
        `Summary: ${p.summary}`,
        `Details: ${p.details}`
      ];
      if (p.contribution) {
        parts.push(`Rafia's Specific Contribution: ${p.contribution}`);
      }
      parts.push(`Featured Status: ${p.featured ? 'Featured Project' : 'Standard Catalog'}`);

      chunks.push({
        id: `project-${p.id}`,
        type: 'project',
        projectId: p.id,
        title: `Project: ${p.title}`,
        link: `./projects.html#${p.id}`,
        content: parts.join('\n')
      });
    });
  }

  return chunks;
}

function buildIndex() {
  console.log('Generating RAG knowledge base and vector index...');
  const chunks = buildChunks();

  // Document frequencies for IDF calculation
  const df = {};
  const totalDocs = chunks.length;

  chunks.forEach(chunk => {
    const tokens = tokenize(chunk.content + ' ' + chunk.title);
    chunk.tokens = tokens;
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach(t => {
      df[t] = (df[t] || 0) + 1;
    });
  });

  // Calculate TF-IDF vectors for each chunk
  chunks.forEach(chunk => {
    const tf = computeTermFrequency(chunk.tokens);
    const vector = {};
    let magnitudeSq = 0;

    for (const term in tf) {
      const idf = Math.log((totalDocs + 1) / ((df[term] || 0) + 1)) + 1;
      const weight = tf[term] * idf;
      vector[term] = weight;
      magnitudeSq += weight * weight;
    }

    chunk.vector = vector;
    chunk.vectorMagnitude = Math.sqrt(magnitudeSq);
    delete chunk.tokens; // Don't bloat JSON with raw token array
  });

  const knowledgeBase = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalChunks: chunks.length,
    df,
    chunks
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(knowledgeBase, null, 2), 'utf-8');
  console.log(`Successfully built RAG vector index with ${chunks.length} chunks at: ${outputPath}`);
}

buildIndex();
