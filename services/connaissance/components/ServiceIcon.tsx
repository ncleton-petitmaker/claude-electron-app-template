interface ServiceIconProps {
  name: string;
  size?: number;
}

export function ServiceIcon({ name, size = 18 }: ServiceIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "chat":
      return <svg {...common}><path d="M21 12c0 4.4-4 8-9 8a10 10 0 0 1-4.3-.9L3 20l1.4-3.7A7.3 7.3 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>;
    case "upload":
      return <svg {...common}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M20 16.5A4.5 4.5 0 0 1 15.5 21h-7A4.5 4.5 0 0 1 4 16.5" /></svg>;
    case "dashboard":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
    case "analytics":
      return <svg {...common}><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-3" /></svg>;
    case "settings":
      return <svg {...common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2l-.1-.1A2 2 0 0 1 7 4l.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1A2 2 0 1 1 20 7l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1h.1a2 2 0 0 1 0 4h-.1a1.8 1.8 0 0 0-1.7 1Z" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "close":
      return <svg {...common}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case "file":
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>;
    case "document":
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h6" /></svg>;
    case "scan":
      return <svg {...common}><path d="M7 3H5a2 2 0 0 0-2 2v2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M17 21h2a2 2 0 0 0 2-2v-2" /><path d="M7 8h10" /><path d="M7 12h10" /><path d="M7 16h6" /></svg>;
    case "video":
      return <svg {...common}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3Z" /></svg>;
    case "image":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="10" r="1.5" /><path d="m21 15-5-5L5 19" /></svg>;
    case "table":
    case "sheet":
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M9 4v16" /><path d="M15 4v16" /></svg>;
    case "text":
      return <svg {...common}><path d="M4 7V5h16v2" /><path d="M12 5v14" /><path d="M8 19h8" /></svg>;
    case "link":
      return <svg {...common}><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2" /><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" /></svg>;
    case "youtube":
      return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="4" /><path d="m10 9 5 3-5 3Z" /></svg>;
    case "linkedin":
      return <svg {...common}><path d="M6 10v8" /><path d="M6 6v.01" /><path d="M10 18v-8" /><path d="M10 13a3 3 0 0 1 6 0v5" /></svg>;
    case "twitter":
      return <svg {...common}><path d="m4 4 16 16" /><path d="m20 4-7.5 8.5" /><path d="M4 20 11.5 11.5" /></svg>;
    case "globe":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></svg>;
    case "camera":
      return <svg {...common}><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><circle cx="12" cy="13" r="3" /></svg>;
    case "clipboard":
      return <svg {...common}><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 4a3 3 0 0 1 6 0" /><path d="M9 12h6" /><path d="M9 16h4" /></svg>;
    case "sparkles":
      return <svg {...common}><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7Z" /><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8Z" /></svg>;
    case "lightbulb":
      return <svg {...common}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8 14a6 6 0 1 1 8 0c-.8.7-1 1.4-1 2H9c0-.6-.2-1.3-1-2Z" /></svg>;
    case "translate":
      return <svg {...common}><path d="M4 5h8" /><path d="M8 5v12" /><path d="M4 17c3-2.5 5-5.5 6-12" /><path d="M12 19l4-9 4 9" /><path d="M14 15h4" /></svg>;
    case "email":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    case "star":
      return <svg {...common}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3L5.8 21 7 14.2 2 9.3l6.9-1Z" /></svg>;
    case "bolt":
      return <svg {...common}><path d="M13 2 4 14h7l-1 8 10-13h-7Z" /></svg>;
    case "send":
      return <svg {...common}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>;
    case "mic":
      return <svg {...common}><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" /><path d="M19 11a7 7 0 0 1-14 0" /><path d="M12 18v4" /></svg>;
    case "brain":
      return <svg {...common}><path d="M12 5a3 3 0 0 0-5.8-1 3 3 0 0 0-1.7 5.2 3.5 3.5 0 0 0 1.1 6.7A3 3 0 0 0 12 19Z" /><path d="M12 5a3 3 0 0 1 5.8-1 3 3 0 0 1 1.7 5.2 3.5 3.5 0 0 1-1.1 6.7A3 3 0 0 1 12 19Z" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>;
  }
}
