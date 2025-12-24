export function buildMarkdown(
    title: string,
    sourceUrl: string,
    body: string,
    sourceLabel: string,
) {
    const safeTitle = title || sourceUrl;
    const trimmedBody = body.trim();
    const sourceLine = `${sourceLabel}: ${sourceUrl}`;
    const bodyContent = trimmedBody ? `\n\n${trimmedBody}` : "";
    return `# ${safeTitle}\n\n${sourceLine}${bodyContent}\n`;
}

export function sanitizeTitle(title: string) {
    const trimmed = title.trim() || "Untitled";
    const normalized = trimmed.replace(/[\\/:*?"<>|]/g, "-");
    return normalized.slice(0, 120);
}
