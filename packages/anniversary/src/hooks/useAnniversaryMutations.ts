import {
  useMutation,
  CREATE_ANNIVERSARY,
  UPDATE_ANNIVERSARY,
  DELETE_ANNIVERSARY,
  UPDATE_ANNIVERSARY_YEAR,
  UPLOAD_ANNIVERSARY_PICTURE,
  DELETE_ANNIVERSARY_PICTURE,
  ADD_ANNIVERSARY_CONTRIBUTOR,
  REMOVE_ANNIVERSARY_CONTRIBUTOR,
  GET_ANNIVERSARIES,
  GET_ANNIVERSARY,
} from '@mycircle/shared';

export function useCreateAnniversary() {
  return useMutation(CREATE_ANNIVERSARY, {
    refetchQueries: [{ query: GET_ANNIVERSARIES }],
  });
}

export function useUpdateAnniversary(anniversaryId?: string) {
  return useMutation(UPDATE_ANNIVERSARY, {
    refetchQueries: anniversaryId
      ? [{ query: GET_ANNIVERSARY, variables: { id: anniversaryId } }, { query: GET_ANNIVERSARIES }]
      : [{ query: GET_ANNIVERSARIES }],
  });
}

export function useDeleteAnniversary() {
  return useMutation(DELETE_ANNIVERSARY, {
    refetchQueries: [{ query: GET_ANNIVERSARIES }],
  });
}

export function useUpdateAnniversaryYear(anniversaryId: string) {
  return useMutation(UPDATE_ANNIVERSARY_YEAR, {
    refetchQueries: [{ query: GET_ANNIVERSARY, variables: { id: anniversaryId } }],
  });
}

export function useUploadAnniversaryPicture(anniversaryId: string) {
  return useMutation(UPLOAD_ANNIVERSARY_PICTURE, {
    refetchQueries: [{ query: GET_ANNIVERSARY, variables: { id: anniversaryId } }],
  });
}

export function useDeleteAnniversaryPicture(anniversaryId: string) {
  return useMutation(DELETE_ANNIVERSARY_PICTURE, {
    refetchQueries: [{ query: GET_ANNIVERSARY, variables: { id: anniversaryId } }],
  });
}

export function useAddContributor() {
  return useMutation(ADD_ANNIVERSARY_CONTRIBUTOR);
}

export function useRemoveContributor() {
  return useMutation(REMOVE_ANNIVERSARY_CONTRIBUTOR);
}
