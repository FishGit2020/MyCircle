import { useQuery, useMutation } from '@mycircle/shared';
import {
  GET_INFANT_ACHIEVEMENTS,
  ADD_INFANT_ACHIEVEMENT,
  UPDATE_INFANT_ACHIEVEMENT,
  DELETE_INFANT_ACHIEVEMENT,
} from '@mycircle/shared';

export interface InfantAchievement {
  id: string;
  childId: string;
  milestoneId: string;
  achievedDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useInfantAchievements(childId: string | null) {
  const skip = !childId;

  const { data, loading } = useQuery<{ infantAchievements: InfantAchievement[] }>(
    GET_INFANT_ACHIEVEMENTS,
    {
      variables: { childId: childId! },
      skip,
      fetchPolicy: 'cache-and-network',
    },
  );

  const [addMutation] = useMutation(ADD_INFANT_ACHIEVEMENT, {
    refetchQueries: skip
      ? []
      : [{ query: GET_INFANT_ACHIEVEMENTS, variables: { childId } }],
  });

  const [updateMutation] = useMutation(UPDATE_INFANT_ACHIEVEMENT, {
    refetchQueries: skip
      ? []
      : [{ query: GET_INFANT_ACHIEVEMENTS, variables: { childId } }],
  });

  const [deleteMutation] = useMutation(DELETE_INFANT_ACHIEVEMENT, {
    refetchQueries: skip
      ? []
      : [{ query: GET_INFANT_ACHIEVEMENTS, variables: { childId } }],
  });

  // Map keyed by milestoneId for O(1) lookup in UI
  const achievementMap = new Map<string, InfantAchievement>(
    (data?.infantAchievements ?? []).map((a) => [a.milestoneId, a]),
  );

  const logAchievement = async (milestoneId: string, achievedDate: string, note?: string | null) => {
    if (!childId) return;
    await addMutation({ variables: { input: { childId, milestoneId, achievedDate, note: note ?? null } } });
  };

  const updateAchievement = async (id: string, updates: { achievedDate?: string; note?: string | null }) => {
    await updateMutation({ variables: { id, input: updates } });
  };

  const clearAchievement = async (id: string) => {
    await deleteMutation({ variables: { id } });
  };

  return {
    achievementMap,
    loading,
    logAchievement,
    updateAchievement,
    clearAchievement,
  };
}
