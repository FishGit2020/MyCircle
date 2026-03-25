import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GraphQLError } from 'graphql';
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ResolverContext {
  uid: string | null;
}

function requireAuth(context: ResolverContext): string {
  if (!context.uid) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.uid;
}

function toTimestampString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'object' && val !== null && 'toMillis' in val) {
    return new Date((val as { toMillis: () => number }).toMillis()).toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

// ─── ATS Scoring ─────────────────────────────────────────────────────────────

function stemWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/(ing|tion|ment|ed|er|ly|s|es)$/, '');
}

function keywordMatches(keyword: string, text: string): boolean {
  const kw = stemWord(keyword.toLowerCase());
  const words = text.toLowerCase().split(/\W+/);
  return words.some(w => stemWord(w) === kw || w.includes(kw));
}

interface KeywordReport {
  role?: string;
  company?: string;
  hardSkills: string[];
  titleKeywords: string[];
  actionKeywords: string[];
  businessContext: string[];
  domainKeywords: string[];
  hardFilters: string[];
  top10: string[];
  alreadyHave: string[];
  needToAdd: string[];
}

interface AtsScore {
  beforeScore: number;
  score: number;
  covered: string[];
  missing: string[];
  beforeCovered: string[];
  beforeMissing: string[];
  hardSkillsMissing: string[];
}

function calculateAtsScore(
  resumeText: string,
  keywordReport: KeywordReport,
  originalResumeText?: string
): AtsScore {
  const allKeywords: Array<{ kw: string; weight: number }> = [
    ...keywordReport.hardSkills.map(kw => ({ kw, weight: 2 })),
    ...keywordReport.titleKeywords.map(kw => ({ kw, weight: 1.5 })),
    ...keywordReport.businessContext.map(kw => ({ kw, weight: 1 })),
  ];

  const covered: string[] = [];
  const missing: string[] = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const { kw, weight } of allKeywords) {
    totalWeight += weight;
    if (keywordMatches(kw, resumeText)) {
      covered.push(kw);
      earnedWeight += weight;
    } else {
      missing.push(kw);
    }
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Before score (original resume)
  const origText = originalResumeText || resumeText;
  const beforeCovered: string[] = [];
  const beforeMissing: string[] = [];
  let beforeEarned = 0;

  for (const { kw, weight } of allKeywords) {
    if (keywordMatches(kw, origText)) {
      beforeCovered.push(kw);
      beforeEarned += weight;
    } else {
      beforeMissing.push(kw);
    }
  }

  const beforeScore = totalWeight > 0 ? Math.round((beforeEarned / totalWeight) * 100) : 0;
  const hardSkillsMissing = keywordReport.hardSkills.filter(kw => !keywordMatches(kw, resumeText));

  return { beforeScore, score, covered, missing, beforeCovered, beforeMissing, hardSkillsMissing };
}

function resumeToText(resume: GeneratedResumeData): string {
  const parts: string[] = [];
  if (resume.contact?.name) parts.push(resume.contact.name);
  if (resume.skills?.length) parts.push(resume.skills.join(' '));
  for (const exp of resume.experiences || []) {
    for (const ver of exp.versions || []) {
      parts.push(ver.title);
      parts.push(...(ver.bullets || []));
    }
  }
  for (const edu of resume.education || []) {
    parts.push(edu.degree, edu.field, edu.school);
  }
  for (const proj of resume.projects || []) {
    parts.push(proj.name, ...(proj.bullets || []));
  }
  return parts.join(' ');
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResumeVersionData {
  id: string;
  title: string;
  bullets: string[];
}

interface ResumeExperienceData {
  id: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  versions: ResumeVersionData[];
}

interface ResumeEducationData {
  id: string;
  school: string;
  location?: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
  notes: string[];
}

interface ResumeProjectData {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

interface ResumeContactData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

interface GeneratedResumeData {
  contact: ResumeContactData;
  experiences: ResumeExperienceData[];
  education: ResumeEducationData[];
  skills: string[];
  projects: ResumeProjectData[];
}

// ─── OpenAI Helpers ──────────────────────────────────────────────────────────

async function callOpenAI(
  openai: OpenAI,
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.1
): Promise<Record<string, unknown>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content) as Record<string, unknown>;
}

async function extractKeywordReport(openai: OpenAI, jdText: string): Promise<KeywordReport> {
  const result = await callOpenAI(
    openai,
    `You are an expert ATS (Applicant Tracking System) analyst. Extract and categorize keywords from a job description. Return JSON with this exact structure:
{
  "role": "job title",
  "company": "company name or null",
  "hardSkills": ["tools", "languages", "platforms", "technical methods"],
  "titleKeywords": ["job title variants and function keywords"],
  "actionKeywords": ["verb + object phrases like 'drive cross-functional execution'"],
  "businessContext": ["business domain concepts like 'roadmap', 'product launch'"],
  "domainKeywords": ["industry words like 'SaaS', 'fintech'"],
  "hardFilters": ["explicit requirements like '3+ years', 'Bachelor degree'"],
  "top10": ["10 most important keywords ranked by importance"],
  "alreadyHave": [],
  "needToAdd": []
}`,
    `Job Description:\n${jdText}`,
    0.1
  );

  return {
    role: result.role as string || '',
    company: result.company as string || undefined,
    hardSkills: (result.hardSkills as string[]) || [],
    titleKeywords: (result.titleKeywords as string[]) || [],
    actionKeywords: (result.actionKeywords as string[]) || [],
    businessContext: (result.businessContext as string[]) || [],
    domainKeywords: (result.domainKeywords as string[]) || [],
    hardFilters: (result.hardFilters as string[]) || [],
    top10: (result.top10 as string[]) || [],
    alreadyHave: [],
    needToAdd: [],
  };
}

async function selectVersions(
  openai: OpenAI,
  experiences: ResumeExperienceData[],
  jdText: string
): Promise<Record<string, string>> {
  const expSummary = experiences.map(exp => ({
    id: exp.id,
    company: exp.company,
    versions: exp.versions.map(v => ({ id: v.id, title: v.title })),
  }));

  const result = await callOpenAI(
    openai,
    `You are an expert resume consultant. Given a job description and a list of work experiences (each with multiple title versions), select the best version ID for each experience that will resonate most with this specific job posting. Return JSON: {"selections": {"expId": "versionId", ...}}`,
    `Job Description:\n${jdText}\n\nExperiences:\n${JSON.stringify(expSummary, null, 2)}`,
    0.1
  );

  return (result.selections as Record<string, string>) || {};
}

async function rewriteBullets(
  openai: OpenAI,
  experiences: ResumeExperienceData[],
  selectedVersionIds: Record<string, string>,
  keywordReport: KeywordReport,
  aggressive = false
): Promise<ResumeExperienceData[]> {
  const targetKeywords = [
    ...keywordReport.hardSkills,
    ...keywordReport.actionKeywords,
    ...keywordReport.businessContext,
  ];

  const expForRewrite = experiences.map(exp => {
    const selectedVer = exp.versions.find(v => v.id === selectedVersionIds[exp.id]) || exp.versions[0];
    return {
      id: exp.id,
      versionId: selectedVer.id,
      title: selectedVer.title,
      bullets: selectedVer.bullets,
    };
  });

  const systemPrompt = aggressive
    ? `You are an expert resume writer. Rewrite bullet points to naturally include missing keywords. You may make slightly larger edits but NEVER fabricate facts. Return JSON: {"rewritten": [{"id": "expId", "bullets": [...]}]}`
    : `You are an expert resume writer. Minimally rewrite bullet points to naturally include missing keywords. Return unchanged bullets if no edit needed. NEVER fabricate facts. Maintain exact bullet count per experience. Never add periods to bullets. Return JSON: {"rewritten": [{"id": "expId", "bullets": [...]}]}`;

  const result = await callOpenAI(
    openai,
    systemPrompt,
    `Missing keywords to include naturally:\n${targetKeywords.join(', ')}\n\nExperiences:\n${JSON.stringify(expForRewrite, null, 2)}`,
    aggressive ? 0.3 : 0.2
  );

  const rewritten = (result.rewritten as Array<{ id: string; bullets: string[] }>) || [];
  const rewrittenMap: Record<string, string[]> = {};
  for (const r of rewritten) {
    rewrittenMap[r.id] = r.bullets;
  }

  return experiences.map(exp => {
    const selectedVerId = selectedVersionIds[exp.id];
    return {
      ...exp,
      versions: exp.versions.map(ver => {
        if (ver.id === selectedVerId && rewrittenMap[exp.id]) {
          return { ...ver, bullets: rewrittenMap[exp.id] };
        }
        return ver;
      }),
    };
  });
}

async function reorganizeSkills(
  openai: OpenAI,
  skills: string[],
  keywordReport: KeywordReport
): Promise<string[]> {
  const result = await callOpenAI(
    openai,
    `You are an expert resume writer. Reorganize skills into 2-3 categories, front-loading the most relevant keywords from the job description. Return JSON: {"skills": ["Category: skill1, skill2", ...]}`,
    `Job keywords (prioritize these):\n${[...keywordReport.hardSkills, ...keywordReport.titleKeywords].join(', ')}\n\nCurrent skills:\n${skills.join('\n')}`,
    0.2
  );

  return (result.skills as string[]) || skills;
}

// ─── SSRF Protection ─────────────────────────────────────────────────────────

function isPrivateIp(hostname: string): boolean {
  const privateRanges = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^::1$/,
    /^0\.0\.0\.0/,
    /^169\.254\./,
    /^fc00:/i,
    /^fe80:/i,
  ];
  return privateRanges.some(r => r.test(hostname));
}

// ─── Resolvers ───────────────────────────────────────────────────────────────

export function createResumeTailorQueryResolvers(getOpenAiKey: () => string) {
  return {
    resumeFactBank: async (_: unknown, __: unknown, context: ResolverContext) => {
      const uid = requireAuth(context);
      const db = getFirestore();
      const doc = await db.collection('users').doc(uid).collection('resumeFactBank').doc('default').get();
      if (!doc.exists) return null;
      const data = doc.data()!;
      return {
        contact: data.contact || { name: '' },
        experiences: data.experiences || [],
        education: data.education || [],
        skills: data.skills || [],
        projects: data.projects || [],
        updatedAt: toTimestampString(data.updatedAt),
      };
    },

    resumeApplications: async (_: unknown, { limit = 50 }: { limit?: number }, context: ResolverContext) => {
      const uid = requireAuth(context);
      const db = getFirestore();
      const cap = Math.min(limit, 100);
      const snap = await db
        .collection('users').doc(uid).collection('resumeApplications')
        .orderBy('date', 'desc')
        .limit(cap)
        .get();
      return snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          date: toTimestampString(data.date),
          company: data.company || '',
          role: data.role || '',
          atsScoreBefore: data.atsScoreBefore || 0,
          atsScoreAfter: data.atsScoreAfter || 0,
          resumeSnapshot: data.resumeSnapshot || '{}',
          jdText: data.jdText || null,
        };
      });
    },

    scrapeJobUrl: async (_: unknown, { url }: { url: string }, context: ResolverContext) => {
      requireAuth(context);

      // Validate URL scheme (SSRF protection)
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        throw new GraphQLError('Invalid URL', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      if (parsed.protocol !== 'https:') {
        throw new GraphQLError('Only HTTPS URLs are supported', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      if (isPrivateIp(parsed.hostname)) {
        throw new GraphQLError('URL points to a private network address', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      try {
        const response = await axios.get(url, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MyCircle/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
          },
          maxRedirects: 3,
        });

        const $ = cheerio.load(response.data as string);

        // Remove noise elements
        $('script, style, nav, footer, header, .cookie-banner, #cookie-notice').remove();

        // Try common job description containers first
        const selectors = [
          '[data-automation="jobDescription"]',
          '.job-description',
          '#job-description',
          '.description',
          'main',
          'article',
          'body',
        ];

        let text = '';
        for (const sel of selectors) {
          const content = $(sel).first().text().trim();
          if (content.length > 200) {
            text = content;
            break;
          }
        }

        if (!text) {
          text = $('body').text().trim();
        }

        // Clean up whitespace and truncate
        text = text.replace(/\s+/g, ' ').slice(0, 8000);
        return text || null;
      } catch {
        return null;
      }
    },
  };
}

export function createResumeTailorMutationResolvers(getOpenAiKey: () => string) {
  return {
    saveResumeFactBank: async (
      _: unknown,
      { input }: { input: Record<string, unknown> },
      context: ResolverContext
    ) => {
      const uid = requireAuth(context);
      const db = getFirestore();
      const ref = db.collection('users').doc(uid).collection('resumeFactBank').doc('default');
      await ref.set({
        ...input,
        updatedAt: FieldValue.serverTimestamp(),
      });
      const snap = await ref.get();
      const data = snap.data()!;
      return {
        contact: data.contact || { name: '' },
        experiences: data.experiences || [],
        education: data.education || [],
        skills: data.skills || [],
        projects: data.projects || [],
        updatedAt: toTimestampString(data.updatedAt),
      };
    },

    generateResume: async (
      _: unknown,
      { jdText }: { jdText: string },
      context: ResolverContext
    ) => {
      const uid = requireAuth(context);
      const openAiKey = getOpenAiKey();
      if (!openAiKey) {
        throw new GraphQLError('AI service not configured', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }

      const db = getFirestore();
      const factBankDoc = await db.collection('users').doc(uid).collection('resumeFactBank').doc('default').get();
      if (!factBankDoc.exists) {
        throw new GraphQLError('No fact bank found. Please upload your resume first.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const factBank = factBankDoc.data() as GeneratedResumeData;
      const openai = new OpenAI({ apiKey: openAiKey });

      // Run keyword extraction and version selection in parallel
      const [keywordReport, selectedVersionIds] = await Promise.all([
        extractKeywordReport(openai, jdText),
        selectVersions(openai, factBank.experiences || [], jdText),
      ]);

      // Build original resume text for before-score
      const originalText = resumeToText(factBank);

      // Update keyword report with before-coverage
      const allKeywordsFlat = [
        ...keywordReport.hardSkills,
        ...keywordReport.titleKeywords,
        ...keywordReport.businessContext,
      ];
      keywordReport.alreadyHave = allKeywordsFlat.filter(kw => keywordMatches(kw, originalText));
      keywordReport.needToAdd = allKeywordsFlat.filter(kw => !keywordMatches(kw, originalText));

      // Run bullet rewriting and skills reorganization in parallel
      const [rewrittenExperiences, reorganizedSkills] = await Promise.all([
        rewriteBullets(openai, factBank.experiences || [], selectedVersionIds, keywordReport, false),
        reorganizeSkills(openai, factBank.skills || [], keywordReport),
      ]);

      const generatedResume: GeneratedResumeData = {
        contact: factBank.contact,
        experiences: rewrittenExperiences,
        education: factBank.education || [],
        skills: reorganizedSkills,
        projects: factBank.projects || [],
      };

      const resumeText = resumeToText(generatedResume);
      const atsScore = calculateAtsScore(resumeText, keywordReport, originalText);

      return {
        ...generatedResume,
        atsScore,
        keywordReport,
      };
    },

    boostAtsScore: async (
      _: unknown,
      { resumeJson, jdText }: { resumeJson: string; jdText: string },
      context: ResolverContext
    ) => {
      requireAuth(context);
      const openAiKey = getOpenAiKey();
      if (!openAiKey) {
        throw new GraphQLError('AI service not configured', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }

      let currentResume: GeneratedResumeData;
      try {
        currentResume = JSON.parse(resumeJson) as GeneratedResumeData;
      } catch {
        throw new GraphQLError('Invalid resume JSON', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const openai = new OpenAI({ apiKey: openAiKey });
      const keywordReport = await extractKeywordReport(openai, jdText);

      // Build selected version map (use first version of each experience)
      const selectedVersionIds: Record<string, string> = {};
      for (const exp of currentResume.experiences || []) {
        if (exp.versions?.[0]) selectedVersionIds[exp.id] = exp.versions[0].id;
      }

      const [rewrittenExperiences, reorganizedSkills] = await Promise.all([
        rewriteBullets(openai, currentResume.experiences || [], selectedVersionIds, keywordReport, true),
        reorganizeSkills(openai, currentResume.skills || [], keywordReport),
      ]);

      const boostedResume: GeneratedResumeData = {
        ...currentResume,
        experiences: rewrittenExperiences,
        skills: reorganizedSkills,
      };

      const originalText = resumeToText(currentResume);
      const boostedText = resumeToText(boostedResume);
      const atsScore = calculateAtsScore(boostedText, keywordReport, originalText);

      const allKeywords = [...keywordReport.hardSkills, ...keywordReport.titleKeywords, ...keywordReport.businessContext];
      keywordReport.alreadyHave = allKeywords.filter(kw => keywordMatches(kw, originalText));
      keywordReport.needToAdd = allKeywords.filter(kw => !keywordMatches(kw, originalText));

      return {
        ...boostedResume,
        atsScore,
        keywordReport,
      };
    },

    saveResumeApplication: async (
      _: unknown,
      { input }: { input: {
        company: string;
        role: string;
        atsScoreBefore: number;
        atsScoreAfter: number;
        resumeSnapshot: string;
        jdText?: string;
      }},
      context: ResolverContext
    ) => {
      const uid = requireAuth(context);
      const db = getFirestore();
      const ref = await db.collection('users').doc(uid).collection('resumeApplications').add({
        company: input.company,
        role: input.role,
        atsScoreBefore: input.atsScoreBefore,
        atsScoreAfter: input.atsScoreAfter,
        resumeSnapshot: input.resumeSnapshot,
        jdText: input.jdText || null,
        date: FieldValue.serverTimestamp(),
      });
      const snap = await ref.get();
      const data = snap.data()!;
      return {
        id: ref.id,
        date: toTimestampString(data.date),
        company: data.company,
        role: data.role,
        atsScoreBefore: data.atsScoreBefore,
        atsScoreAfter: data.atsScoreAfter,
        resumeSnapshot: data.resumeSnapshot,
        jdText: data.jdText || null,
      };
    },

    deleteResumeApplication: async (
      _: unknown,
      { id }: { id: string },
      context: ResolverContext
    ) => {
      const uid = requireAuth(context);
      const db = getFirestore();
      const ref = db.collection('users').doc(uid).collection('resumeApplications').doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      await ref.delete();
      return true;
    },
  };
}
