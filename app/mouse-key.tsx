export default function MouseKey({ button }: { button?: "left" | "right" }) {
  const label = button ? `${button === "left" ? "Left" : "Right"} mouse button` : "Mouse movement";
  return (
    <kbd aria-label={label} title={label}>
      <svg width="18" height="22" viewBox="0 0 24 28" fill="none" aria-hidden="true" focusable="false">
        {button && (
          <path
            d={button === "left" ? "M12 3a8 8 0 0 0-8 8v2h8Z" : "M12 3a8 8 0 0 1 8 8v2h-8Z"}
            fill="currentColor"
          />
        )}
        <rect x="4" y="3" width="16" height="22" rx="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 3v10M4 13h16" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </kbd>
  );
}
