import { useEffect, useState } from 'react';
import './DraftForm.css';

function DraftForm({
  initialTitle = '',
  initialContent = '',
  onSubmit,
  submitLabel = 'Save',
  isSubmitting = false,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  function validate() {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Title is required.';
    if (!content.trim()) nextErrors.content = 'Content is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ title: title.trim(), content: content.trim() });
  }

  return (
    <form className="draft-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="draft-title">Title</label>
        <input
          id="draft-title"
          type="text"
          className={`form-input${errors.title ? ' form-input--error' : ''}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {errors.title && <span className="form-error">{errors.title}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="draft-content">Content</label>
        <textarea
          id="draft-content"
          rows={10}
          className={`form-textarea${errors.content ? ' form-input--error' : ''}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {errors.content && <span className="form-error">{errors.content}</span>}
      </div>

      <div className="draft-form__actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default DraftForm;
