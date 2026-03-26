import { useState, useCallback } from 'react';
import { useMutation, useLazyQuery } from '@mycircle/shared';
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

export function useResumeGeneration(model: string, endpointId: string | null) {
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [status, setStatus] = useState<'idle' | 'scraping' | 'generating' | 'boosting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [generateResumeMutation] = useMutation(GENERATE_RESUME);
  const [boostAtsScoreMutation] = useMutation(BOOST_ATS_SCORE);
  const [scrapeJobUrlQuery] = useLazyQuery(SCRAPE_JOB_URL, { fetchPolicy: 'network-only' });

  const scrapeUrl = useCallback(async (url: string) => {
    setStatus('scraping');
    setErrorMsg(null);
    try {
      const result = await scrapeJobUrlQuery({ variables: { url } });
      const text = result.data?.scrapeJobUrl ?? '';
      setJobDescription(text);
      setStatus('idle');
      return text;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to scrape URL');
      setStatus('error');
      return '';
    }
  }, [scrapeJobUrlQuery]);

  const generate = useCallback(async (_factBank: FactBank) => {
    if (!jobDescription.trim()) {
      setErrorMsg('Please enter a job description first.');
      return;
    }
    if (!model) {
      setErrorMsg('Please select a model first.');
      return;
    }
    setStatus('generating');
    setErrorMsg(null);
    try {
      const result = await generateResumeMutation({
        variables: {
          jdText: jobDescription,
          model,
          endpointId: endpointId ?? null,
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
  }, [jobDescription, model, endpointId, generateResumeMutation]);

  const boost = useCallback(async (_factBank: FactBank) => {
    if (!generatedResume || !jobDescription.trim()) return;
    if (!model) {
      setErrorMsg('Please select a model first.');
      return;
    }
    setStatus('boosting');
    setErrorMsg(null);
    try {
      const result = await boostAtsScoreMutation({
        variables: {
          resumeJson: JSON.stringify(generatedResume),
          jdText: jobDescription,
          model,
          endpointId: endpointId ?? null,
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
  }, [generatedResume, jobDescription, model, endpointId, boostAtsScoreMutation]);

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
