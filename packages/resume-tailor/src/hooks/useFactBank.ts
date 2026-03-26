import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@mycircle/shared';
import { GET_RESUME_FACT_BANK, SAVE_RESUME_FACT_BANK, SUBMIT_RESUME_PARSE, GET_RESUME_PARSE_JOB } from '@mycircle/shared';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResumeContact {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ResumeVersion {
  id: string;
  title: string;
  bullets: string[];
}

export interface ResumeExperience {
  id: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  versions: ResumeVersion[];
}

export interface ResumeEducation {
  id: string;
  school: string;
  location?: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
  notes: string[];
}

export interface ResumeProject {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

export interface FactBank {
  contact: ResumeContact;
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  projects: ResumeProject[];
  updatedAt?: string;
}

function emptyFactBank(): FactBank {
  return {
    contact: { name: '' },
    experiences: [],
    education: [],
    skills: [],
    projects: [],
  };
}

function uuid(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFactBank() {
  const { data, loading } = useQuery(GET_RESUME_FACT_BANK);
  const [saveFactBank] = useMutation(SAVE_RESUME_FACT_BANK);
  const [submitParseMutation] = useMutation(SUBMIT_RESUME_PARSE);
  const [pollParseJob] = useLazyQuery(GET_RESUME_PARSE_JOB, { fetchPolicy: 'network-only' });

  const [factBank, setFactBank] = useState<FactBank>(emptyFactBank());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from server on load
  useEffect(() => {
    if (data?.resumeFactBank) {
      setFactBank(data.resumeFactBank as FactBank);
    }
  }, [data]);

  // Debounced save
  const debouncedSave = useCallback((updated: FactBank) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(async () => {
      try {
        await saveFactBank({
          variables: {
            input: {
              contact: updated.contact,
              experiences: updated.experiences,
              education: updated.education,
              skills: updated.skills,
              projects: updated.projects,
            },
          },
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }, 1000);
  }, [saveFactBank]);

  const update = useCallback((updater: (prev: FactBank) => FactBank) => {
    setFactBank(prev => {
      const next = updater(prev);
      debouncedSave(next);
      return next;
    });
  }, [debouncedSave]);

  // Poll a parse job until complete
  const pollUntilDone = useCallback(async (jobId: string): Promise<Partial<FactBank>> => {
    const maxAttempts = 90; // 90 * 3s = 4.5 min max
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const { data: jobData } = await pollParseJob({ variables: { id: jobId } });
      const job = jobData?.resumeParseJob;
      if (!job) throw new Error('Parse job not found');
      if (job.status === 'complete' && job.result) return job.result as Partial<FactBank>;
      if (job.status === 'error') throw new Error(job.error || 'Parse failed');
    }
    throw new Error('Parse timed out. Please try again.');
  }, [pollParseJob]);

  // Upload and parse a resume file (async via GraphQL)
  const uploadAndParse = useCallback(async (file: File, model: string, endpointId?: string | null) => {
    const base64 = await fileToBase64(file);
    const { data: submitData } = await submitParseMutation({
      variables: {
        fileName: file.name,
        fileBase64: base64,
        contentType: file.type || 'application/octet-stream',
        model,
        endpointId: endpointId || null,
      },
    });
    const jobId = submitData?.submitResumeParse?.id;
    if (!jobId) throw new Error('Failed to submit parse job');
    const parsed = await pollUntilDone(jobId);
    update(prev => mergeFactBanks(prev, parsed));
  }, [update, submitParseMutation, pollUntilDone]);

  // Parse pasted plain text (async via GraphQL)
  const parseFromText = useCallback(async (text: string, model: string, endpointId?: string | null) => {
    const base64 = btoa(unescape(encodeURIComponent(text)));
    const { data: submitData } = await submitParseMutation({
      variables: {
        fileName: 'pasted-resume.txt',
        fileBase64: base64,
        contentType: 'text/plain',
        model,
        endpointId: endpointId || null,
      },
    });
    const jobId = submitData?.submitResumeParse?.id;
    if (!jobId) throw new Error('Failed to submit parse job');
    const parsed = await pollUntilDone(jobId);
    update(prev => mergeFactBanks(prev, parsed));
  }, [update, submitParseMutation, pollUntilDone]);

  // Parse from a Cloud File (fetch by URL, then submit as base64)
  const parseFromCloudFile = useCallback(async (
    fileName: string, downloadUrl: string, contentType: string,
    model: string, endpointId?: string | null
  ) => {
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error('Failed to fetch file');
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    const { data: submitData } = await submitParseMutation({
      variables: {
        fileName,
        fileBase64: base64,
        contentType: contentType || 'application/octet-stream',
        model,
        endpointId: endpointId || null,
      },
    });
    const jobId = submitData?.submitResumeParse?.id;
    if (!jobId) throw new Error('Failed to submit parse job');
    const parsed = await pollUntilDone(jobId);
    update(prev => mergeFactBanks(prev, parsed));
  }, [update, submitParseMutation, pollUntilDone]);

  // CRUD helpers
  const updateContact = useCallback((contact: ResumeContact) => {
    update(prev => ({ ...prev, contact }));
  }, [update]);

  const addExperience = useCallback(() => {
    update(prev => ({
      ...prev,
      experiences: [...prev.experiences, {
        id: uuid(),
        company: '',
        startDate: '',
        endDate: 'Present',
        versions: [{ id: uuid(), title: '', bullets: [''] }],
      }],
    }));
  }, [update]);

  const updateExperience = useCallback((exp: ResumeExperience) => {
    update(prev => ({
      ...prev,
      experiences: prev.experiences.map(e => e.id === exp.id ? exp : e),
    }));
  }, [update]);

  const deleteExperience = useCallback((id: string) => {
    update(prev => ({
      ...prev,
      experiences: prev.experiences.filter(e => e.id !== id),
    }));
  }, [update]);

  const addEducation = useCallback(() => {
    update(prev => ({
      ...prev,
      education: [...prev.education, {
        id: uuid(),
        school: '',
        degree: '',
        field: '',
        notes: [],
      }],
    }));
  }, [update]);

  const updateEducation = useCallback((edu: ResumeEducation) => {
    update(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === edu.id ? edu : e),
    }));
  }, [update]);

  const deleteEducation = useCallback((id: string) => {
    update(prev => ({
      ...prev,
      education: prev.education.filter(e => e.id !== id),
    }));
  }, [update]);

  const updateSkills = useCallback((skills: string[]) => {
    update(prev => ({ ...prev, skills }));
  }, [update]);

  const addProject = useCallback(() => {
    update(prev => ({
      ...prev,
      projects: [...prev.projects, { id: uuid(), name: '', bullets: [''] }],
    }));
  }, [update]);

  const updateProject = useCallback((proj: ResumeProject) => {
    update(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === proj.id ? proj : p),
    }));
  }, [update]);

  const deleteProject = useCallback((id: string) => {
    update(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  }, [update]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(factBank, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fact-bank-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [factBank]);

  const importJson = useCallback(async (file: File) => {
    const text = await file.text();
    const imported = JSON.parse(text) as Partial<FactBank>;
    update(() => ({
      contact: imported.contact || { name: '' },
      experiences: imported.experiences || [],
      education: imported.education || [],
      skills: imported.skills || [],
      projects: imported.projects || [],
    }));
  }, [update]);

  return {
    factBank,
    loading,
    saveStatus,
    uploadAndParse,
    parseFromText,
    parseFromCloudFile,
    updateContact,
    addExperience,
    updateExperience,
    deleteExperience,
    addEducation,
    updateEducation,
    deleteEducation,
    updateSkills,
    addProject,
    updateProject,
    deleteProject,
    exportJson,
    importJson,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix
      resolve(result.split(',')[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mergeFactBanks(existing: FactBank, incoming: Partial<FactBank>): FactBank {
  // Merge contact (incoming wins on non-empty fields)
  const contact: ResumeContact = { ...existing.contact };
  if (incoming.contact) {
    for (const key of Object.keys(incoming.contact) as (keyof ResumeContact)[]) {
      const val = incoming.contact[key];
      if (val && typeof val === 'string' && val.trim()) {
        (contact as Record<string, string>)[key] = val;
      }
    }
  }

  // Merge experiences (group by company name, avoid exact duplicates)
  const experiences = [...existing.experiences];
  for (const exp of incoming.experiences || []) {
    const existing_ = experiences.find(e =>
      e.company.toLowerCase().trim() === exp.company.toLowerCase().trim()
    );
    if (existing_) {
      // Add new versions that don't already exist
      for (const ver of exp.versions) {
        const alreadyExists = existing_.versions.some(
          v => v.title.toLowerCase().trim() === ver.title.toLowerCase().trim()
        );
        if (!alreadyExists) {
          existing_.versions.push({ ...ver, id: uuid() });
        }
      }
    } else {
      experiences.push({ ...exp, id: uuid(), versions: exp.versions.map(v => ({ ...v, id: uuid() })) });
    }
  }

  // Merge education (avoid duplicates by school+degree)
  const education = [...existing.education];
  for (const edu of incoming.education || []) {
    const alreadyExists = education.some(
      e => e.school.toLowerCase() === edu.school.toLowerCase() &&
           e.degree.toLowerCase() === edu.degree.toLowerCase()
    );
    if (!alreadyExists) education.push({ ...edu, id: uuid() });
  }

  // Merge skills (combine unique entries)
  const skillSet = new Set(existing.skills);
  for (const s of incoming.skills || []) {
    if (!skillSet.has(s)) skillSet.add(s);
  }

  // Merge projects
  const projects = [...existing.projects];
  for (const proj of incoming.projects || []) {
    const alreadyExists = projects.some(
      p => p.name.toLowerCase() === proj.name.toLowerCase()
    );
    if (!alreadyExists) projects.push({ ...proj, id: uuid() });
  }

  return { contact, experiences, education, skills: [...skillSet], projects };
}
