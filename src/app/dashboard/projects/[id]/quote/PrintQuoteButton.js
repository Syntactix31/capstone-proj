"use client";

export default function PrintQuoteButton() {
  return (
    <button
      className="admin-btn admin-btn--primary"
      type="button"
      onClick={() => window.print()}
    >
      Print quotation
    </button>
  );
}
