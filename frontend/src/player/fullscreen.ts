type LegacyElement = HTMLElement & { webkitRequestFullscreen?: () => void | Promise<void> };
type LegacyDocument = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void | Promise<void> };
export function fullscreenElement(doc: Document = document) {
  return doc.fullscreenElement || (doc as LegacyDocument).webkitFullscreenElement;
}
export async function enterFullscreen(element: HTMLElement): Promise<boolean> {
  try {
    if (element.requestFullscreen) await element.requestFullscreen();
    else if ((element as LegacyElement).webkitRequestFullscreen) await (element as LegacyElement).webkitRequestFullscreen!();
    else return false;
    return true;
  } catch { return false; }
}
export async function leaveFullscreen(doc: Document = document) {
  if (!fullscreenElement(doc)) return;
  if (doc.exitFullscreen) await doc.exitFullscreen();
  else await (doc as LegacyDocument).webkitExitFullscreen?.();
}
