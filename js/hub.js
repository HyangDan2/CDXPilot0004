export const HUB_URL = "https://hyangdan2.github.io/GameHub/";

// Keep native same-tab anchor activation; cleanup must complete synchronously.
export function connectHubLinks(links, beforeLeave, page = window) {
  let leaving = false;
  for (const link of links) {
    link.href = HUB_URL;
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      if (leaving) {
        event.preventDefault();
        return;
      }
      leaving = true;
      beforeLeave();
    });
  }
  page.addEventListener("pageshow", () => { leaving = false; });
}
