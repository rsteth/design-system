/** Shared by browser suites that click inside a fixture preview.
 *
 *  A sandboxed preview is a cross-origin frame, and the browser does not always deliver a click
 *  to it: the click can land on the host page's <iframe> element and the fixture never sees it.
 *  Observed on unchanged engine code, mostly for the first click after a preview is created and
 *  more often on a loaded machine. The window is usually under half a second and was once seen
 *  to last about three. In separate measurements a preview past that window took every one of
 *  several hundred clicks, wherever on screen and immediately after a page scroll.
 *
 *  One case did not clear by itself. The click scrolls a partly visible target only as far as
 *  the nearest viewport edge, and with the target left a few pixels above the bottom edge some
 *  page loads never delivered a click in ten seconds of trying. Moving the target to the middle
 *  of the viewport after an undelivered click got the next click delivered every time it was
 *  tried, so that is what a repeat does first. Why the edge matters was not established.
 *
 *  clickInPreview counts clicks in the preview's own document. A click the fixture never
 *  received had no effect there, so it is safe to repeat; one that was received is never
 *  repeated. This checks delivery only and asserts nothing about what the fixture did. */
/** How long one click is given to show up in the preview before it counts as undelivered. */
const DELIVERY_WINDOW_MS = 500;

export async function clickInPreview(page, child, target, { timeout = 10000 } = {}) {
  const delivered = () => child.evaluate(() => {
    if (window.__previewClicks === undefined) {
      window.__previewClicks = 0;
      addEventListener('click', () => { window.__previewClicks++; }, true);
    }
    return window.__previewClicks;
  });
  const giveUp = Date.now() + timeout;
  for (let attempt = 1; ; attempt++) {
    const before = await delivered();
    await target.click();
    for (const deadline = Date.now() + DELIVERY_WINDOW_MS; Date.now() < deadline; await page.waitForTimeout(25)) if (await delivered() > before) return attempt;
    if (Date.now() >= giveUp) throw new Error(`The fixture preview received none of ${attempt} clicks in ${timeout}ms.`);
    const box = await target.boundingBox();
    if (box) await page.evaluate(middle => scrollBy(0, middle - innerHeight / 2), box.y + box.height / 2);
  }
}
