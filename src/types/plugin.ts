export type FetchService = "firecrawl";

export interface PluginSettings {
    firecrawlApiKey: string;
    defaultNotebookId: string;
    defaultService: FetchService;
}

export interface NotebookInfo {
    id: string;
    name: string;
    closed?: boolean;
}

export type WebFetchI18n = Record<string, string>;
