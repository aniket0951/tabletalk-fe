"use client";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-fadeO"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="mx-4 w-full max-w-[360px] overflow-hidden rounded-[14px] bg-surface shadow-[0_20px_60px_rgba(0,0,0,.12)] animate-slideUp sm:mx-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="text-sm font-bold">{title}</div>
          <button
            onClick={onCancel}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border bg-surface2 text-sm text-text2 hover:bg-red-bg hover:text-red"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-text2">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-[14px]">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border-[1.5px] border-border2 bg-transparent px-[18px] py-[9px] text-[13px] font-semibold text-text hover:bg-surface2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red px-[18px] py-[9px] text-[13px] font-semibold text-white hover:bg-[#7f1d1d] disabled:opacity-50"
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
