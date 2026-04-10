import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
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

export const onResumeParseJobCreated = onDocumentCreated(
  {
    document: 'users/{uid}/resumeParseJobs/{jobId}',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const uid = event.params.uid;
    const jobId = event.params.jobId;
    const db = getFirestore();
    const jobRef = db.doc(`users/${uid}/resumeParseJobs/${jobId}`);

    try {
      const { fileName, fileBase64, contentType, model, endpointId } = data;
      logger.info('Starting resume parse job', { uid, jobId, fileName, contentType, model });

      // Extract text
      const buffer = Buffer.from(fileBase64, 'base64');
      let text = '';

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

      if (!text.trim()) {
        logger.warn('No text extracted from resume', { uid, jobId, fileName, contentType });
        await jobRef.update({ status: 'error', error: 'No text found in this file.' });
        return;
      }

      logger.info('Text extracted from resume', { uid, jobId, textLength: text.length });

      // Clear base64 to save Firestore storage (no longer needed)
      await jobRef.update({ fileBase64: '' });

      // Resolve Ollama endpoint
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
        logger.warn('No AI endpoint configured for resume parse', { uid, jobId });
        await jobRef.update({ status: 'error', error: 'No AI endpoint configured. Please add an Ollama endpoint in Settings.' });
        return;
      }

      logger.info('Calling AI for resume parse', { uid, jobId, model, endpoint: endpointUrl });
      // Update status to processing
      await jobRef.update({ status: 'processing' });

      // Call AI
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

      await jobRef.update({
        status: 'complete',
        result: {
          contact: structured.contact || { name: '' },
          experiences: structured.experiences || [],
          education: structured.education || [],
          skills: structured.skills || [],
          projects: structured.projects || [],
          updatedAt: new Date().toISOString(),
        },
      });

      logger.info('Resume parse job complete', { uid, jobId, fileName });
    } catch (err: any) {
      logger.error('Resume parse job failed', { uid, jobId, error: err.message });
      await jobRef.update({
        status: 'error',
        error: 'Could not parse this file. Please try a different format or model.',
      });
    }
  }
);
