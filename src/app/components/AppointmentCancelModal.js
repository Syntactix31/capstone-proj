'use client';

export default function AppointmentCancelModal({
  open,
  busy = false,
  onClose,
  onConfirm,
  subtitle = 'This will remove it from Google Calendar and send cancel emails.'
}) {
  if (!open) return null;

  return (
    <div className="admin-modal">
      <button
        className="admin-modal__backdrop"
        onClick={onClose}
        aria-label="Close cancel confirmation"
        type="button"
      />
      <div className="admin-modal__content" role="dialog" aria-modal="true">
        <div className="admin-modal__header">
          <div>
            <h2 className="admin-title">Are you sure?</h2>
            <p className="admin-subtitle">{subtitle}</p>
          </div>
          <button
            className="admin-btn admin-btn--ghost admin-btn--small"
            onClick={onClose}
            type="button"
            disabled={busy}
          >
            Close
          </button>
        </div>

        <div className="admin-modal__actions">
          <button
            className="admin-btn admin-btn--danger"
            type="button"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Canceling…' : 'Yes, cancel it'}
          </button>
          <button
            className="admin-btn admin-btn--ghost"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Keep appointment
          </button>
        </div>
      </div>
    </div>
  );
}
