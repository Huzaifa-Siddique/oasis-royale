// Usage example:
// const unsubscribe = onNetworkChange((online) => console.log('Network state:', online ? 'Online' : 'Offline'));

export const isOnline = (): boolean =>
  typeof navigator !== 'undefined' ? navigator.onLine : true;

export const onNetworkChange = (cb: (online: boolean) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => cb(true);
  const handleOffline = () => cb(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

export const getConnectionQuality = (): '4g' | '3g' | '2g' | 'slow' => {
  if (typeof navigator === 'undefined') return '4g';
  return (navigator as any)?.connection?.effectiveType || '4g';
};
