import {PluginSettings} from "./types/plugin";

export const STORAGE_NAME = "web-fetch-settings";

export const DEFAULT_SETTINGS: PluginSettings = {
    firecrawlApiKey: "",
    firecrawlEndpoint: "",
    defaultNotebookId: "",
    defaultService: "firecrawl",
    autoOpenNote: true,
};
