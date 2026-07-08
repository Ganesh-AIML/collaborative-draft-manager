import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDraft } from '../hooks/useDraft';
import { useCreateDraft, useUpdateDraft, useDeleteDraft } from '../hooks/useDraftMutations';
import DraftForm from '../components/DraftForm';
import Notification from '../components/Notification';
import DraftListSkeleton from '../components/DraftListSkeleton';
import './DraftEditorPage.css';

function DraftEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data, isLoading, isError, error } = useDraft(isEditMode ? id : undefined);
  const createDraft = useCreateDraft();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();

  function handleSubmit(values) {
    if (createDraft.isPending || updateDraft.isPending) return; // prevent duplicate submits

    if (isEditMode) {
      updateDraft.mutate(
        { id, data: values, version: data?.data?.version },
        {
          onSuccess: () => {
            setShowSuccess(true);
          },
        }
      );
    } else {
      createDraft.mutate(values, { onSuccess: () => navigate('/') });
    }
  }

  function handleDelete() {
    if (deleteDraft.isPending) return; // prevent duplicate submits
    if (window.confirm('Delete this draft? This cannot be undone.')) {
      deleteDraft.mutate(id, { onSuccess: () => navigate('/') });
    }
  }

  if (isEditMode && isLoading) {
    return (
      <div className="draft-editor-page">
        <DraftListSkeleton count={1} />
      </div>
    );
  }

  if (isEditMode && isError) {
    return (
      <div className="draft-editor-page">
        <Notification type="error">
          {error?.response?.data?.message || 'Failed to load draft.'}
        </Notification>
      </div>
    );
  }

  const mutationError = createDraft.error || updateDraft.error;
  const isConflict = updateDraft.error?.response?.status === 409;
  const conflictVersion = updateDraft.error?.response?.data?.currentVersion;

  return (
    <div className="draft-editor-page">
      <div className="draft-editor-card">
        <button type="button" className="btn btn-secondary btn-sm draft-editor-page__back" onClick={() => navigate('/')}>
          &larr; Back
        </button>
        <h1>{isEditMode ? 'Edit Draft' : 'New Draft'}</h1>

        {showSuccess && (
          <Notification
            type="success"
            autoDismiss
            duration={3000}
            onDismiss={() => setShowSuccess(false)}
          >
            Draft saved successfully.
          </Notification>
        )}

        {isConflict ? (
          <Notification type="conflict">
            <strong>This draft has been updated by another user.</strong>
            Your changes were not saved (current version: {conflictVersion}). The latest version has been loaded below.
          </Notification>
        ) : (
          mutationError && (
            <Notification type="error">
              {mutationError?.response?.data?.message || 'Something went wrong.'}
            </Notification>
          )
        )}

        <DraftForm
          initialTitle={data?.data?.title || ''}
          initialContent={data?.data?.content || ''}
          onSubmit={handleSubmit}
          submitLabel={isEditMode ? 'Save Changes' : 'Create Draft'}
          isSubmitting={createDraft.isPending || updateDraft.isPending}
        />

        {isEditMode && (
          <div className="draft-editor-page__danger-zone">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleteDraft.isPending}
            >
              {deleteDraft.isPending ? 'Deleting...' : 'Delete Draft'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DraftEditorPage;
