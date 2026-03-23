import { useState } from 'react';
import { useQuery, useMutation } from '@mycircle/shared';
import {
  GET_JOURNAL_PHOTOS,
  ADD_JOURNAL_PHOTO,
  DELETE_JOURNAL_PHOTO,
} from '@mycircle/shared';

export interface JournalPhoto {
  id: string;
  childId: string | null;
  photoUrl: string;
  storagePath: string;
  caption: string | null;
  stageLabel: string | null;
  photoDate: string;
  createdAt: string;
}

interface UseJournalPhotosOptions {
  childId?: string | null;
}

export function useJournalPhotos({ childId }: UseJournalPhotosOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data, loading } = useQuery<{ journalPhotos: JournalPhoto[] }>(GET_JOURNAL_PHOTOS, {
    variables: { childId: childId ?? null },
    fetchPolicy: 'cache-and-network',
  });

  const [addPhotoMutation] = useMutation(ADD_JOURNAL_PHOTO, {
    refetchQueries: [{ query: GET_JOURNAL_PHOTOS, variables: { childId: childId ?? null } }],
  });

  const [deletePhotoMutation] = useMutation(DELETE_JOURNAL_PHOTO, {
    refetchQueries: [{ query: GET_JOURNAL_PHOTOS, variables: { childId: childId ?? null } }],
  });

  const upload = async (
    file: Blob,
    options?: { caption?: string | null; photoDate?: string | null; stageLabel?: string | null },
  ) => {
    if (!window.__journalPhotos) {
      throw new Error('Journal photos API not available');
    }
    setUploading(true);
    setUploadError(null);
    try {
      const result = await window.__journalPhotos.upload(file, {
        childId: childId ?? null,
        caption: options?.caption ?? null,
        photoDate: options?.photoDate ?? null,
      });
      // Store metadata via GraphQL
      await addPhotoMutation({
        variables: {
          input: {
            childId: childId ?? null,
            photoUrl: result.photoUrl,
            storagePath: result.storagePath,
            caption: options?.caption ?? null,
            stageLabel: options?.stageLabel ?? null,
            photoDate: options?.photoDate ?? new Date().toISOString().substring(0, 10),
          },
        },
      });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Upload failed';
      setUploadError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (id: string) => {
    await deletePhotoMutation({ variables: { id } });
  };

  return {
    photos: data?.journalPhotos ?? [],
    loading,
    uploading,
    uploadError,
    clearUploadError: () => setUploadError(null),
    upload,
    deletePhoto,
  };
}
