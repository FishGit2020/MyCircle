import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@mycircle/shared';
import { GET_RESUME_FACT_BANK, SAVE_RESUME_FACT_BANK } from '@mycircle/shared';

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

  // Upload and parse a resume file
  const uploadAndParse = useCallback(async (file: File) => {
    const base64 = await fileToBase64(file);
    const api = (window as unknown as { __resumeTailor?: { uploadAndParse: (n: string, b: string, c: string) => Promise<Partial<FactBank>> } }).__resumeTailor;
    if (!api) throw new Error('Resume upload not available');
    const parsed = await api.uploadAndParse(file.name, base64, file.type || 'application/octet-stream');
    // Merge into existing fact bank
    update(prev => mergeFactBanks(prev, parsed));
  }, [update]);

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
