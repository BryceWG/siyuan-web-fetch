export type FetchService = "firecrawl" | "jina";

export interface PluginSettings {
    firecrawlApiKey: string;
    firecrawlEndpoint: string;
    defaultNotebookId: string;
    defaultService: FetchService;
    autoOpenNote: boolean;
}

export interface NotebookInfo {
    id: string;
    name: string;
    closed?: boolean;
}

export type WebFetchI18n = Record<string, string>;
