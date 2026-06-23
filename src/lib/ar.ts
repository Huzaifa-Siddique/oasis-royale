"use client";

// ── sync helpers ──────────────────────────────────────────────

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    (/iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /Chrome/i.test(navigator.userAgent) &&
    !/Edg|OPR|Brave|SamsungBrowser/i.test(navigator.userAgent)
  );
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|Instagram|LinkedIn|Messenger|WeChat|Line/i.test(
    navigator.userAgent,
  );
}

export function supportsARQuickLook(): boolean {
  if (typeof document === "undefined") return false;
  const a = document.createElement("a");
  return !!(a.relList && a.relList.supports && a.relList.supports("ar"));
}

// ── sync AR detection ─────────────────────────────────────────

export function canUseQuickLook(): boolean {
  return isIOS() && !isInAppBrowser() && supportsARQuickLook();
}

// Known ARCore device patterns (userAgent fragments)
const ARCORE_DEVICE_PATTERNS = [
  /SM-[A-Z]\d{3,}/,
  /Pixel \d/,
  /OnePlus/,
  /moto /,
  /LM-[A-Z]\d{3,}/,
];

function hasKnownARCoreDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return ARCORE_DEVICE_PATTERNS.some((p) => p.test(navigator.userAgent));
}

// ── ARCore detection via WebXR ────────────────────────────────

async function checkARCoreAvailable(): Promise<boolean> {
  const nav = navigator as Navigator & {
    xr?: { isSessionSupported: (mode: string) => Promise<boolean> };
  };
  if (typeof navigator === "undefined" || !nav.xr) return false;
  try {
    return await nav.xr.isSessionSupported("immersive-ar");
  } catch {
    return false;
  }
}

// ── async AR capability check ─────────────────────────────────

export async function canActivateAR(): Promise<boolean> {
  if (isIOS()) {
    if (!canUseQuickLook()) return false;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
    return true;
  }
  if (isAndroid()) {
    if (!isChrome() || isInAppBrowser()) return false;
    // Device whitelist prevents false-positive on Vivo (isSessionSupported
    // returns true even without ARCore). Samsung/Pixel match and pass.
    if (!hasKnownARCoreDevice()) return false;
    return checkARCoreAvailable();
  }
  return false;
}

// ── iOS AR launch via Quick Look (direct USDZ, no model-viewer) ─

function launchARIOS(modelUrl: string, iosSrc?: string): void {
  const usdzUrl = iosSrc || modelUrl.replace(/\.glb$/, '.usdz');
  const absUrl = usdzUrl.startsWith("http")
    ? usdzUrl
    : window.location.origin + usdzUrl;

  const anchor = document.createElement("a");
  anchor.rel = "ar";
  anchor.href = absUrl;
  anchor.appendChild(document.createElement("img"));
  anchor.click();
}

// ── Android AR launch via Scene Viewer intent ─────────────────

function launchARAndroid(modelUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const absUrl = modelUrl.startsWith("http")
      ? modelUrl
      : window.location.origin + modelUrl;
    const encoded = encodeURIComponent(absUrl);
    const intentUrl =
      `intent://arvr.google.com/scene-viewer/1.0?file=${encoded}&mode=ar_preferred` +
      "#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;";

    let resolved = false;

    const onVisibilityChange = () => {
      if (document.hidden) {
        resolved = true;
        cleanup();
        resolve();
      }
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        cleanup();
        reject(
          new Error(
            "AR could not be launched. ARCore may not be available on this device.",
          ),
        );
      }
    }, 12_000);

    const cleanup = () => {
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.location.href = intentUrl;
  });
}

// ── Public AR launch ──────────────────────────────────────────

export async function launchAR(modelUrl: string, iosSrc?: string): Promise<void> {
  if (isIOS()) launchARIOS(modelUrl, iosSrc);
  else if (isAndroid()) return launchARAndroid(modelUrl);
  else throw new Error("AR not supported on this device");
}
