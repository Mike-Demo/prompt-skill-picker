/**
 * CodePen accepts a prefilled pen through a documented POST form, so no API key
 * or server round trip is needed. The skill markdown is dropped into the HTML
 * pane as escaped preformatted text, which keeps it readable and editable.
 */
const CODEPEN_ENDPOINT = "https://codepen.io/pen/define";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function openInCodePen(name: string, markdown: string): void {
  const payload = {
    title: `${name} — SKILL.md`,
    description: "Opened from Skill Finder.",
    editors: "1000",
    html: `<article class="skill">\n<pre>${escapeHtml(markdown)}</pre>\n</article>`,
    css: [
      "body { margin: 0; background: #0f172a; color: #e2e8f0; font: 14px/1.6 ui-sans-serif, system-ui, sans-serif; }",
      ".skill { max-width: 46rem; margin: 0 auto; padding: 2rem 1.25rem; }",
      ".skill pre { white-space: pre-wrap; word-break: break-word; margin: 0; font: inherit; }",
    ].join("\n"),
  };

  const form = document.createElement("form");
  form.method = "POST";
  form.action = CODEPEN_ENDPOINT;
  form.target = "_blank";
  form.rel = "noopener noreferrer";
  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "data";
  input.value = JSON.stringify(payload).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
  form.remove();
}
