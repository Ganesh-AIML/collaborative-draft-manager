import { useEffect } from 'react';
import './Notification.css';

function Notification({ type = 'error', children, onDismiss, autoDismiss = false, duration = 3000 }) {
  useEffect(() => {
    if (!autoDismiss || !onDismiss) return undefined;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [autoDismiss, duration, onDismiss]);

  return (
    <div className={`notification notification--${type}`} role={type === 'error' || type === 'conflict' ? 'alert' : 'status'}>
      <div className="notification__content">{children}</div>
      {onDismiss && (
        <button
          type="button"
          className="notification__close"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          &times;
        </button>
      )}
    </div>
  );
}

export default Notification;
