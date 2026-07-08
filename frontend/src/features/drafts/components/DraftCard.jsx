import './DraftCard.css';

function DraftCard({ draft, onEdit, onDelete }) {
  function handleDelete() {
    if (window.confirm(`Delete "${draft.title}"? This cannot be undone.`)) {
      onDelete(draft.id);
    }
  }

  return (
    <div className="draft-card">
      <div className="draft-card__body">
        <h3 className="draft-card__title">{draft.title}</h3>
        <p className="draft-card__preview">{draft.content}</p>
      </div>
      <div className="draft-card__footer">
        <div className="draft-card__meta">
          <span>Updated {new Date(draft.updatedAt).toLocaleString()}</span>
          <span className="draft-card__version">v{draft.version}</span>
        </div>
        <div className="draft-card__actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(draft.id)}>
            Edit
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DraftCard;
