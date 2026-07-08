import './DraftListSkeleton.css';

function DraftListSkeleton({ count = 6 }) {
  return (
    <div className="draft-list">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line--short" />
          <div className="skeleton-card__footer">
            <div className="skeleton-line skeleton-line--meta" />
            <div className="skeleton-line skeleton-line--meta" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default DraftListSkeleton;
