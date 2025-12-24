/**
 * Firecrawl 服务
 * 负责与 Firecrawl API 进行交互
 */

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

/**
 * 使用 Firecrawl API 抓取网页内容
 * @param url - 要抓取的网页 URL
 * @param apiKey - Firecrawl API 密钥
 * @returns 抓取结果，包含标题、源 URL 和 Markdown 内容
 */
export async function scrapeFirecrawl(
    url: string,
    apiKey: string,
): Promise<ScrapeResult> {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
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
