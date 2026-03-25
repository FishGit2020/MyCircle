import { useCallback, useState } from 'react';
import { useQuery, useMutation } from '@mycircle/shared';
import { GET_RESUME_APPLICATIONS, SAVE_RESUME_APPLICATION, DELETE_RESUME_APPLICATION } from '@mycircle/shared';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResumeApplication {
  id: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  resumeSnapshot: string;
  atsScore?: number;
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt: string;
  updatedAt?: string;
  notes?: string;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useApplicationsLog() {
  const { data, loading, refetch } = useQuery(GET_RESUME_APPLICATIONS, {
    variables: { limit: 50 },
  });
  const [saveApplicationMutation] = useMutation(SAVE_RESUME_APPLICATION);
  const [deleteApplicationMutation] = useMutation(DELETE_RESUME_APPLICATION);
  const [saving, setSaving] = useState(false);

  const applications: ResumeApplication[] = (data?.resumeApplications ?? []) as ResumeApplication[];

  const saveApplication = useCallback(async (input: Omit<ResumeApplication, 'id' | 'appliedAt' | 'updatedAt'>) => {
    setSaving(true);
    try {
      await saveApplicationMutation({ variables: { input } });
      await refetch();
    } finally {
      setSaving(false);
    }
  }, [saveApplicationMutation, refetch]);

  const updateApplication = useCallback(async (id: string, input: Partial<Omit<ResumeApplication, 'id' | 'appliedAt'>>) => {
    setSaving(true);
    try {
      await saveApplicationMutation({ variables: { input: { id, ...input } } });
      await refetch();
    } finally {
      setSaving(false);
    }
  }, [saveApplicationMutation, refetch]);

  const deleteApplication = useCallback(async (id: string) => {
    await deleteApplicationMutation({ variables: { id } });
    await refetch();
  }, [deleteApplicationMutation, refetch]);

  return {
    applications,
    loading,
    saving,
    saveApplication,
    updateApplication,
    deleteApplication,
  };
}
