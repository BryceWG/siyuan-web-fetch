/**
 * Firecrawl 服务
 * 负责与 Firecrawl API 进行交互
 */

const FIRECRAWL_DEFAULT_ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
const FIRECRAWL_SCRAPE_PATH = "/v2/scrape";

const resolveFirecrawlScrapeEndpoint = (endpointInput?: string) => {
    const trimmed = (endpointInput ?? "").trim();
    if (!trimmed) {
        return FIRECRAWL_DEFAULT_ENDPOINT;
    }

    try {
        const url = new URL(trimmed);
        const normalizedPath = url.pathname.replace(/\/+$/, "");

        if (normalizedPath.endsWith("/scrape")) {
            url.pathname = normalizedPath;
            return url.toString();
        }
        if (normalizedPath.endsWith("/v2")) {
            url.pathname = `${normalizedPath}/scrape`;
            return url.toString();
        }

        url.pathname = `${normalizedPath}${FIRECRAWL_SCRAPE_PATH}`;
        return url.toString();
    } catch {
        const normalized = trimmed.replace(/\/+$/, "");
        if (normalized.endsWith("/scrape")) {
            return normalized;
        }
        if (normalized.endsWith("/v2")) {
            return `${normalized}/scrape`;
        }
        return `${normalized}${FIRECRAWL_SCRAPE_PATH}`;
    }
};

interface FirecrawlScrapeResponse {
    success: boolean;
    data?: {
        markdown?: string;
        metadata?: {
            title?: string;
            sourceURL?: string;
        };
    };
    error?: string;
}

interface ScrapeResult {
    title: string;
    sourceUrl: string;
    markdown: string;
}

interface ScrapeFirecrawlOptions {
    apiKey?: string;
    endpoint?: string;
}

/**
 * 使用 Firecrawl API 抓取网页内容
 * @param url - 要抓取的网页 URL
 * @param options - Firecrawl 请求参数
 * @returns 抓取结果，包含标题、源 URL 和 Markdown 内容
 */
export async function scrapeFirecrawl(
    url: string,
    options: ScrapeFirecrawlOptions,
): Promise<ScrapeResult> {
    const endpoint = resolveFirecrawlScrapeEndpoint(options.endpoint);
    const apiKey = (options.apiKey ?? "").trim();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
            url,
            formats: ["markdown"],
        }),
    });

    if (!response.ok) {
        throw new Error(`Firecrawl ${response.status}`);
    }

    const payload = (await response.json()) as FirecrawlScrapeResponse;
    if (!payload.success || !payload.data) {
        throw new Error(payload.error || "Firecrawl error");
    }

    const title = payload.data.metadata?.title?.trim() || url;
    const sourceUrl = payload.data.metadata?.sourceURL || url;
    const markdown = payload.data.markdown?.trim() || "";

    return {title, sourceUrl, markdown};
}
