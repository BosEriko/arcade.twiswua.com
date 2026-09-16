"use client";

import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from "react";
import styles from "./screen-ui.module.css";

export function ScreenLayer({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`${styles.layer} ${className}`} {...props} />;
}

export function ScreenPanel({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`${styles.panel} ${className}`} {...props} />;
}

export function ScreenContent({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`${styles.content} ${className}`} {...props} />;
}

export function ScreenActions({ className = "", ...props }: ComponentProps<"footer">) {
  return <footer className={`${styles.actions} ${className}`} {...props} />;
}

export function ScreenButton({ className = "", type = "button", ...props }: ComponentProps<"button">) {
  return <button type={type} className={`${styles.button} ${className}`} {...props} />;
}

export function GameStartScreen({ eyebrow, title, description, actionLabel, onStart, hint }: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  actionLabel: string;
  onStart: () => void;
  hint: ReactNode;
}) {
  const titleId = useId();
  return (
    <ScreenLayer className={styles.startScreen}>
      <ScreenPanel className={styles.startPanel} role="region" aria-labelledby={titleId}>
        <span className={styles.startEyebrow}>{eyebrow}</span>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
        <ScreenButton className={styles.startButton} onClick={onStart}>
          {actionLabel}<span aria-hidden="true">↗</span>
        </ScreenButton>
        <small className={styles.startHint}>{hint}</small>
      </ScreenPanel>
    </ScreenLayer>
  );
}

export function ScreenHeader({ id, title, eyebrow, onClose, closeDisabled, closeLabel = "Close screen" }: {
  id: string;
  title: ReactNode;
  eyebrow: string;
  onClose: () => void;
  closeDisabled?: boolean;
  closeLabel?: string;
}) {
  return <header className={styles.header}>
    <div><span>{eyebrow}</span><h2 id={id}>{title}</h2></div>
    <ScreenButton className={styles.close} onClick={onClose} disabled={closeDisabled} aria-label={closeLabel}>×</ScreenButton>
  </header>;
}

export function ScreenView({ container, titleId, onClose, children }: {
  container: HTMLElement;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const view = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = view.current;
    if (!panel) return;
    const previousFocus = document.activeElement;
    const background = Array.from(container.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== panel)
      .map((element) => ({ element, inert: element.inert }));
    background.forEach(({ element }) => { element.inert = true; });
    const stopGameKeys = (event: KeyboardEvent) => event.stopPropagation();
    document.addEventListener("keydown", stopGameKeys);
    document.addEventListener("keyup", stopGameKeys);
    panel.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", stopGameKeys);
      document.removeEventListener("keyup", stopGameKeys);
      const restoreFocus = panel.contains(document.activeElement) || document.activeElement === document.body;
      background.forEach(({ element, inert }) => { element.inert = inert; });
      if (restoreFocus && previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [container]);
  return <div ref={view} className={styles.view} role="dialog" aria-labelledby={titleId} tabIndex={-1}
    onKeyDown={(event) => {
      event.stopPropagation();
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
    }}
    onKeyUp={(event) => event.stopPropagation()}>
    {children}
  </div>;
}
