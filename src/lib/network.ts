// Usage example:
// const isSlow = isSlowNetwork();
// console.log('Is slow network:', isSlow);
//
// const shouldPreferPoster = preferPoster();
// console.log('Should prefer poster:', shouldPreferPoster);

interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

export function isSlowNetwork(): boolean {
  if (typeof navigator === 'undefined' || !navigator.connection) {
    return false;
  }
  const connection = navigator.connection;
  return connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' || connection.effectiveType === '3g' || connection.saveData === true;
}

export function preferPoster(): boolean {
  return isSlowNetwork();
}
