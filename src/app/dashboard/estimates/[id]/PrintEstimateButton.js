"use client";

export default function PrintEstimateButton() {
  return (
    <button
      className="admin-btn admin-btn--primary"
      type="button"
      onClick={() => window.print()}
    >
      Print estimate
    </button>
  );
}
