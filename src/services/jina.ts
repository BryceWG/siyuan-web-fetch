/**
 * Jina Reader service
 * Handles requests to the Jina Reader API.
 */

interface ScrapeResult {
    title: string;
    sourceUrl: string;
    markdown: string;
}

const JINA_READER_ENDPOINT = "https://r.jina.ai/";
const JINA_HEADERS = {
    "X-Engine": "browser",
    "X-Md-Bullet-List-Marker": "-",
    "X-Md-Em-Delimiter": "*",
    "X-Md-Heading-Style": "setext",
    "X-Md-Hr": "---",
    "X-Md-Link-Style": "discarded",
    "X-No-Gfm": "true",
    "X-Return-Format": "markdown",
};

const isSetextUnderline = (line: string) => /^=+$/.test(line) || /^-+$/.test(line);

const extractTitle = (markdown: string) => {
    const lines = markdown.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i].trim();
        if (!line) {
            continue;
        }
        if (line.startsWith("#")) {
            const cleaned = line.replace(/^#+\s*/, "").trim();
            if (cleaned) {
                return cleaned;
            }
        }
        const next = lines[i + 1]?.trim();
        if (
            next &&
            isSetextUnderline(next) &&
            !/^(?:[-*>]|\d+\.)\s/.test(line)
        ) {
            return line;
        }
    }
    return "";
};

/**
 * Fetch page content via Jina Reader.
 * @param url - Page URL to fetch
 * @returns Result with title, source URL, and Markdown
 */
export async function scrapeJina(url: string): Promise<ScrapeResult> {
    const response = await fetch(`${JINA_READER_ENDPOINT}${url}`, {
        headers: JINA_HEADERS,
    });

    if (!response.ok) {
        throw new Error(`Jina ${response.status}`);
    }

    const markdown = (await response.text()).trim();
    const title = extractTitle(markdown) || url;

    return {title, sourceUrl: url, markdown};
}
