import { useState } from 'react';
import { useTranslation, useMutation, ADD_ANNIVERSARY_CONTRIBUTOR, REMOVE_ANNIVERSARY_CONTRIBUTOR, GET_ANNIVERSARY } from '@mycircle/shared';
import type {
  AddAnniversaryContributorMutation,
  AddAnniversaryContributorMutationVariables,
  RemoveAnniversaryContributorMutation,
  RemoveAnniversaryContributorMutationVariables,
  AnniversaryContributor,
} from '@mycircle/shared';
import UserSearch from './UserSearch';

interface ContributorManagerProps {
  anniversaryId: string;
  ownerUid: string;
  contributors: AnniversaryContributor[];
  contributorUids: string[];
}

export default function ContributorManager({
  anniversaryId,
  ownerUid,
  contributors,
  contributorUids,
}: ContributorManagerProps) {
  const { t } = useTranslation();
  const [showSearch, setShowSearch] = useState(false);
  const [confirmRemoveUid, setConfirmRemoveUid] = useState<string | null>(null);

  const currentUid = window.__currentUid;
  const isOwner = currentUid === ownerUid;

  const [addContributor, { loading: adding }] = useMutation<
    AddAnniversaryContributorMutation,
    AddAnniversaryContributorMutationVariables
  >(ADD_ANNIVERSARY_CONTRIBUTOR, {
    refetchQueries: [{ query: GET_ANNIVERSARY, variables: { id: anniversaryId } }],
  });

  const [removeContributor, { loading: removing }] = useMutation<
    RemoveAnniversaryContributorMutation,
    RemoveAnniversaryContributorMutationVariables
  >(REMOVE_ANNIVERSARY_CONTRIBUTOR, {
    refetchQueries: [{ query: GET_ANNIVERSARY, variables: { id: anniversaryId } }],
  });

  if (!isOwner) return null;

  function handleSelect(uid: string) {
    addContributor({ variables: { anniversaryId, contributorUid: uid } });
    setShowSearch(false);
  }

  function handleRemove(uid: string) {
    removeContributor({ variables: { anniversaryId, contributorUid: uid } });
    setConfirmRemoveUid(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('anniversary.contributors' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h3>
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          disabled={adding}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
          aria-label={t('anniversary.addContributor' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        >
          {t('anniversary.addContributor' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>

      {showSearch && (
        <UserSearch
          onSelect={handleSelect}
          excludeUids={[ownerUid, ...contributorUids]}
        />
      )}

      {contributors.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('anniversary.noResults' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
      ) : (
        <ul className="space-y-2">
          {contributors.map((c) => (
            <li
              key={c.uid}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {c.displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
              </div>
              {confirmRemoveUid === c.uid ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {t('anniversary.confirmRemoveContributor' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(c.uid)}
                    disabled={removing}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                    aria-label={t('anniversary.removeContributor' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                  >
                    {t('anniversary.removeContributor' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveUid(null)}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={t('anniversary.cancel' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                  >
                    {t('anniversary.cancel' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemoveUid(c.uid)}
                  disabled={removing}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                  aria-label={t('anniversary.removeContributor' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                >
                  {t('anniversary.removeContributor' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
