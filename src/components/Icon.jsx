export function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {name === 'grid' && <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />}
      {name === 'check' && <path d="M9.5 17.2 4.8 12.5l1.8-1.8 2.9 2.9 7.9-7.9 1.8 1.8-9.7 9.7Z" />}
      {name === 'bookmark' && <path d="M6 4h12v17l-6-3.8L6 21V4Z" />}
      {name === 'sun' && <path d="M12 6.8a5.2 5.2 0 1 1 0 10.4 5.2 5.2 0 0 1 0-10.4Zm-1-5h2v3h-2v-3Zm0 17.2h2v3h-2v-3ZM2 11h3v2H2v-2Zm17 0h3v2h-3v-2ZM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1Zm12.1 12.1 1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1Zm2.1-13.5 1.4 1.4-2.1 2.1-1.4-1.4 2.1-2.1ZM6.3 16.3l1.4 1.4-2.1 2.1-1.4-1.4 2.1-2.1Z" />}
      {name === 'moon' && <path d="M20.4 15.2A8.2 8.2 0 0 1 8.8 3.6 8.8 8.8 0 1 0 20.4 15.2Z" />}
      {name === 'star' && <path d="m12 2.8 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 2.8Z" />}
      {name === 'shield' && <path d="M12 2.7 20 6v5.9c0 4.8-3.2 8.2-8 9.4-4.8-1.2-8-4.6-8-9.4V6l8-3.3Zm0 3L6.5 8v3.9c0 3.4 2 5.7 5.5 6.8 3.5-1.1 5.5-3.4 5.5-6.8V8L12 5.7Z" />}
      {name === 'leaf' && <path d="M20.8 3.2C11 3.4 5.5 8.3 5.5 15c0 .8.1 1.5.4 2.2L3 20.1 4.9 22l2.7-2.7c.8.4 1.8.6 2.9.6 6.6 0 10.3-6.7 10.3-16.7ZM9.4 16.9c3.1-3.5 6.1-5.8 9-7.1-1.5 5-4.1 7.7-7.8 7.7-.4 0-.8 0-1.2-.1v-.5Z" />}
      {name === 'bolt' && <path d="M13.4 2 4.6 13.2h6.1L9.8 22l9.6-12.4h-6.3L13.4 2Z" />}
      {name === 'compass' && <path d="M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19Zm3.7 5.8-5.4 2-2 5.4 5.4-2 2-5.4Z" />}
    </svg>
  );
}

export const categoryColors = { Mind: 'mind', Body: 'body', Discovery: 'discovery' };

export function categoryIcon(category) {
  if (category === 'Body') return 'bolt';
  if (category === 'Mind') return 'leaf';
  return 'compass';
}
