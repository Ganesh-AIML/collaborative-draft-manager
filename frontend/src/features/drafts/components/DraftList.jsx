import DraftCard from './DraftCard';
import './DraftList.css';

function DraftList({ drafts, onEdit, onDelete, onCreate }) {
  if (!drafts || drafts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon" aria-hidden="true" />
        <h3 className="empty-state__title">No drafts found</h3>
        <p className="empty-state__text">Create your first draft to get started.</p>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          Create Draft
        </button>
      </div>
    );
  }

  return (
    <div className="draft-list">
      {drafts.map((draft) => (
        <DraftCard key={draft.id} draft={draft} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default DraftList;
