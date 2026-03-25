import { useState, useCallback } from 'react';
import { useMutation } from '@mycircle/shared';
import {
  GENERATE_RESUME,
  BOOST_ATS_SCORE,
  SCRAPE_JOB_URL,
} from '@mycircle/shared';
import type { FactBank } from './useFactBank';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AtsScore {
  overall: number;
  hardSkillsScore: number;
  titleScore: number;
  contextScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface KeywordReport {
  hardSkills: string[];
  titleKeywords: string[];
  businessContext: string[];
}

export interface GeneratedResume {
  contact: FactBank['contact'];
  experiences: Array<{
    id: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    title: string;
    bullets: string[];
  }>;
  education: FactBank['education'];
  skills: string[];
  projects: FactBank['projects'];
  atsScore: AtsScore;
  keywordReport: KeywordReport;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useResumeGeneration() {
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [status, setStatus] = useState<'idle' | 'scraping' | 'generating' | 'boosting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [generateResumeMutation] = useMutation(GENERATE_RESUME);
  const [boostAtsScoreMutation] = useMutation(BOOST_ATS_SCORE);
  const [scrapeJobUrlMutation] = useMutation(SCRAPE_JOB_URL);

  const scrapeUrl = useCallback(async (url: string) => {
    setStatus('scraping');
    setErrorMsg(null);
    try {
      const result = await scrapeJobUrlMutation({ variables: { url } });
      const text = result.data?.scrapeJobUrl ?? '';
      setJobDescription(text);
      setStatus('idle');
      return text;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to scrape URL');
      setStatus('error');
      return '';
    }
  }, [scrapeJobUrlMutation]);

  const generate = useCallback(async (factBank: FactBank) => {
    if (!jobDescription.trim()) {
      setErrorMsg('Please enter a job description first.');
      return;
    }
    setStatus('generating');
    setErrorMsg(null);
    try {
      const result = await generateResumeMutation({
        variables: {
          input: {
            jobDescription,
            factBank: {
              contact: factBank.contact,
              experiences: factBank.experiences,
              education: factBank.education,
              skills: factBank.skills,
              projects: factBank.projects,
            },
          },
        },
      });
      const data = result.data?.generateResume;
      if (data) {
        setGeneratedResume(data as GeneratedResume);
      }
      setStatus('idle');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate resume');
      setStatus('error');
    }
  }, [jobDescription, generateResumeMutation]);

  const boost = useCallback(async (factBank: FactBank) => {
    if (!generatedResume || !jobDescription.trim()) return;
    setStatus('boosting');
    setErrorMsg(null);
    try {
      const result = await boostAtsScoreMutation({
        variables: {
          input: {
            jobDescription,
            currentResume: generatedResume,
            factBank: {
              contact: factBank.contact,
              experiences: factBank.experiences,
              education: factBank.education,
              skills: factBank.skills,
              projects: factBank.projects,
            },
          },
        },
      });
      const data = result.data?.boostAtsScore;
      if (data) {
        setGeneratedResume(data as GeneratedResume);
      }
      setStatus('idle');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Boost failed');
      setStatus('error');
    }
  }, [generatedResume, jobDescription, boostAtsScoreMutation]);

  const updateGeneratedBullets = useCallback((
    experienceIndex: number,
    bulletIndex: number,
    value: string,
  ) => {
    setGeneratedResume(prev => {
      if (!prev) return prev;
      const experiences = prev.experiences.map((exp, ei) => {
        if (ei !== experienceIndex) return exp;
        const bullets = exp.bullets.map((b, bi) => (bi === bulletIndex ? value : b));
        return { ...exp, bullets };
      });
      return { ...prev, experiences };
    });
  }, []);

  const updateGeneratedSkills = useCallback((skills: string[]) => {
    setGeneratedResume(prev => prev ? { ...prev, skills } : prev);
  }, []);

  return {
    jobDescription,
    setJobDescription,
    jobUrl,
    setJobUrl,
    generatedResume,
    setGeneratedResume,
    status,
    errorMsg,
    scrapeUrl,
    generate,
    boost,
    updateGeneratedBullets,
    updateGeneratedSkills,
  };
}
