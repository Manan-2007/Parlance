import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button, type ButtonVariant } from "./Button";
import { IconButton } from "./IconButton";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Native <dialog> opened with showModal(): focus is trapped, the page behind is
 * inert, Escape closes it, and focus returns to the opener. No custom trap.
 */
export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[2rem] border-0 bg-surface p-0 text-ink shadow-lg backdrop:bg-navy/50"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <h2 id={titleId} className="text-xl leading-7 font-extrabold tracking-[-0.025em]">
          {title}
        </h2>
        <IconButton label="Close dialog" icon={<X />} size="sm" onClick={onClose} className="-mt-1 -mr-2" />
      </div>
      {description && (
        <div id={descriptionId} className="px-5 pt-1 text-[0.9375rem] leading-6 text-ink-2">
          {description}
        </div>
      )}
      {children && <div className="px-5 pt-4">{children}</div>}
      {footer && <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line bg-paper-50 px-5 py-4">{footer}</div>}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
