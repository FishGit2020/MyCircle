import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ALLOWED_ORIGINS, checkRateLimit, verifyAuthToken } from './shared.js';

const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'text/html',
  'text/rtf',
  'application/rtf',
  'application/json',
  'application/octet-stream',
]);

const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileBase64: z.string().min(1),
  contentType: z.string().min(1),
  model: z.string().min(1),
  endpointId: z.string().nullable().optional(),
});

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Use pdfjs-dist legacy build for Node.js
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as string) as {
    getDocument: (src: { data: Uint8Array }) => { promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
      }>;
    }> };
  };

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  return pages.join('\n');
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export const resumeTailor = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '512MiB',
    timeoutSeconds: 120,
  },
  async (req: Request, res: Response) => {
    // Only POST supported
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Require auth
    const uid = await verifyAuthToken(req);
    if (!uid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Rate limit: 10 req/min per IP
    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    if (checkRateLimit(clientIp, 10, 60)) {
      res.status(429).json({ error: 'Too many requests. Please wait before trying again.' });
      return;
    }

    const path = req.path.replace(/^\/resume-tailor\/?/, '').replace(/^\/+/, '');

    if (path !== 'upload') {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    // Validate request schema
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { fileName, fileBase64, contentType } = parsed.data;

    // Check content type
    if (!ALLOWED_RESUME_TYPES.has(contentType)) {
      res.status(400).json({ error: 'Unsupported file type. Please upload a PDF, DOCX, Markdown, HTML, RTF, or text file.' });
      return;
    }

    // Decode base64
    let buffer: Buffer;
    try {
      buffer = Buffer.from(fileBase64, 'base64');
    } catch {
      res.status(400).json({ error: 'Invalid file encoding.' });
      return;
    }

    // Check file size
    if (buffer.length > MAX_FILE_BYTES) {
      res.status(413).json({ error: 'File exceeds 5MB limit. Please compress the file and try again.' });
      return;
    }

    // Extract text from file
    let text = '';
    try {
      if (contentType === 'application/pdf') {
        text = await extractTextFromPdf(buffer);
      } else if (
        contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        contentType === 'application/msword'
      ) {
        text = await extractTextFromDocx(buffer);
      } else {
        text = buffer.toString('utf-8');
      }
    } catch {
      res.status(500).json({
        error: 'Could not extract text from this file. Please try pasting your resume as text instead.',
      });
      return;
    }

    if (!text.trim()) {
      res.status(500).json({
        error: 'No text found in this file. Please try a different file or paste your resume as text.',
      });
      return;
    }

    const { model, endpointId = null } = parsed.data;
    logger.info('Resume tailor upload', { uid, fileName, contentType, textLength: text.length, model });

    // Get Ollama endpoint from Firestore
    const db = (await import('firebase-admin/firestore')).getFirestore();
    let endpointUrl = '';
    let cfHeaders: Record<string, string> = {};
    if (endpointId) {
      const doc = await db.doc(`users/${uid}/benchmarkEndpoints/${endpointId}`).get();
      if (doc.exists) {
        const d = doc.data()!;
        endpointUrl = d.url || '';
        if (d.cfAccessClientId) cfHeaders['CF-Access-Client-Id'] = d.cfAccessClientId;
        if (d.cfAccessClientSecret) cfHeaders['CF-Access-Client-Secret'] = d.cfAccessClientSecret;
      }
    } else {
      const snap = await db.collection(`users/${uid}/benchmarkEndpoints`).orderBy('createdAt').limit(1).get();
      if (!snap.empty) {
        const d = snap.docs[0].data();
        endpointUrl = d.url || '';
        if (d.cfAccessClientId) cfHeaders['CF-Access-Client-Id'] = d.cfAccessClientId;
        if (d.cfAccessClientSecret) cfHeaders['CF-Access-Client-Secret'] = d.cfAccessClientSecret;
      }
    }

    if (!endpointUrl) {
      logger.warn('No AI endpoint configured for resume tailor', { uid });
      res.status(500).json({ error: 'No AI endpoint configured. Please add an Ollama endpoint in Settings.' });
      return;
    }

    try {
      logger.info('Calling AI for resume tailor', { uid, model, endpoint: endpointUrl });
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        baseURL: `${endpointUrl}/v1`,
        apiKey: 'ollama',
        defaultHeaders: Object.keys(cfHeaders).length > 0 ? cfHeaders : undefined,
      });

      const response = await openai.chat.completions.create({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser. Extract structured data from a resume text and return JSON with this structure:
{
  "contact": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "website": "" },
  "experiences": [
    {
      "id": "exp-1",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "versions": [{ "id": "ver-1", "title": "", "bullets": [] }]
    }
  ],
  "education": [{ "id": "edu-1", "school": "", "location": "", "degree": "", "field": "", "startDate": "", "endDate": "", "notes": [] }],
  "skills": ["Category: skill1, skill2"],
  "projects": [{ "id": "proj-1", "name": "", "startDate": "", "endDate": "", "bullets": [] }]
}
Use sequential ids (exp-1, exp-2, etc.). Extract all experiences with their bullet points. For missing fields use empty string.`,
          },
          { role: 'user', content: `Parse this resume:\n\n${text.slice(0, 12000)}` },
        ],
      });

      const content = response.choices[0]?.message?.content || '{}';
      let structured: Record<string, unknown>;
      try {
        structured = JSON.parse(content) as Record<string, unknown>;
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        structured = match ? JSON.parse(match[0]) as Record<string, unknown> : {};
      }
      logger.info('Resume tailor complete', { uid, fileName });
      res.status(200).json(structured);
    } catch (err: any) {
      logger.error('Resume AI parse error', { uid, error: err.message });
      res.status(500).json({
        error: 'Could not parse this file with the selected model. Please try a different format or model.',
        fileName,
      });
    }
  }
);
