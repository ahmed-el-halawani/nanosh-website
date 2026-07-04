// Single source of truth for the desktop breakpoint (900px).
export const desktopMQ = window.matchMedia('(min-width: 900px)');
export const isDesktop = () => desktopMQ.matches;
