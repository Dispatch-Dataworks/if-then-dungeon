/** Accessible modal dialogs built on <dialog> (focus trap and Escape handling come from the browser). */
import { h, type Child } from "./dom";

export interface ModalAction {
  label: string;
  primary?: boolean;
  onClick: () => void;
}

export function openModal(opts: { title: string; body: Child; actions: ModalAction[]; className?: string; dismissible?: boolean; onDismiss?: () => void }) {
  const titleId = `modal-${Math.random().toString(36).slice(2)}`;
  const dialog = h("dialog", { class: `modal ${opts.className ?? ""}`, "aria-labelledby": titleId });
  const close = () => {
    if (dialog.open) dialog.close();
    dialog.remove();
  };
  dialog.append(
    h("h2", { id: titleId }, opts.title),
    h("div", { class: "modal__body" }, opts.body),
    h("div", { class: "modal__actions" }, opts.actions.map((a) =>
      h("button", { type: "button", class: `btn ${a.primary ? "btn--primary" : ""}`, onclick: () => { close(); a.onClick(); } }, a.label))),
  );
  dialog.addEventListener("cancel", (ev) => {
    if (opts.dismissible === false) ev.preventDefault();
    else {
      ev.preventDefault();
      close();
      opts.onDismiss?.();
    }
  });
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.querySelector<HTMLElement>(".btn--primary")?.focus({ preventScroll: true });
  dialog.scrollTop = 0;
  return { close, el: dialog };
}
