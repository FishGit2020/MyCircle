import { useQuery, useMutation } from '@mycircle/shared';
import {
  GET_MILESTONE_EVENTS,
  ADD_MILESTONE_EVENT,
  UPDATE_MILESTONE_EVENT,
  DELETE_MILESTONE_EVENT,
} from '@mycircle/shared';

export interface MilestoneEvent {
  id: string;
  childId: string | null;
  title: string;
  eventDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseMilestoneEventsOptions {
  childId?: string | null;
}

export function useMilestoneEvents({ childId }: UseMilestoneEventsOptions = {}) {
  const { data, loading, error } = useQuery<{ milestoneEvents: MilestoneEvent[] }>(GET_MILESTONE_EVENTS, {
    variables: { childId: childId ?? null },
    fetchPolicy: 'cache-and-network',
  });

  const [addEventMutation] = useMutation(ADD_MILESTONE_EVENT, {
    refetchQueries: [{ query: GET_MILESTONE_EVENTS, variables: { childId: childId ?? null } }],
  });

  const [updateEventMutation] = useMutation(UPDATE_MILESTONE_EVENT, {
    refetchQueries: [{ query: GET_MILESTONE_EVENTS, variables: { childId: childId ?? null } }],
  });

  const [deleteEventMutation] = useMutation(DELETE_MILESTONE_EVENT, {
    refetchQueries: [{ query: GET_MILESTONE_EVENTS, variables: { childId: childId ?? null } }],
  });

  const addEvent = async (input: {
    title: string;
    eventDate: string;
    note?: string | null;
    childId?: string | null;
  }) => {
    await addEventMutation({ variables: { input } });
  };

  const updateEvent = async (
    id: string,
    input: { title?: string; eventDate?: string; note?: string | null },
  ) => {
    await updateEventMutation({ variables: { id, input } });
  };

  const deleteEvent = async (id: string) => {
    await deleteEventMutation({ variables: { id } });
  };

  return {
    events: data?.milestoneEvents ?? [],
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
