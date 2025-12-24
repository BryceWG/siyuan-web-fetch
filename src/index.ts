import {
    Dialog,
    fetchPost,
    getFrontend,
    openTab,
    Plugin,
    Setting,
    showMessage,
} from "siyuan";
import "./index.scss";
import {scrapeFirecrawl} from "./services/firecrawl";

type FetchService = "firecrawl";

interface PluginSettings {
    firecrawlApiKey: string;
    defaultNotebookId: string;
    defaultService: FetchService;
}

interface NotebookInfo {
    id: string;
    name: string;
    closed?: boolean;
}

const STORAGE_NAME = "web-fetch-settings";
const DEFAULT_SETTINGS: PluginSettings = {
    firecrawlApiKey: "",
    defaultNotebookId: "",
    defaultService: "firecrawl",
};

export default class WebFetchPlugin extends Plugin {
    private settings: PluginSettings = {...DEFAULT_SETTINGS};
    private settingsLoaded?: Promise<void>;
    private notebooks: NotebookInfo[] = [];
    private isMobile = false;

    onload() {
        this.isMobile = ["mobile", "browser-mobile"].includes(getFrontend());
        this.addCommand({
            langKey: "commandOpenPanel",
            hotkey: "",
            callback: () => {
                void this.openFetchDialog();
            },
        });
    }

    async onLayoutReady() {
        await this.ensureSettings();
        this.addTopBar({
            icon: "iconDownload",
            title: this.i18n.panelTitle,
            position: "right",
            callback: () => {
                void this.openFetchDialog();
            },
        });
        await this.setupSettingsUI();
    }

    async uninstall() {
        await this.removeData(STORAGE_NAME);
    }

    private async ensureSettings() {
        if (!this.settingsLoaded) {
            this.settingsLoaded = (async () => {
                const stored = await this.loadData(STORAGE_NAME);
                this.settings = {
                    ...DEFAULT_SETTINGS,
                    ...(stored ?? {}),
                };
                this.data[STORAGE_NAME] = {...this.settings};
            })();
        }
        await this.settingsLoaded;
    }

    private async setupSettingsUI() {
        const apiKeyInput = document.createElement("input");
        apiKeyInput.className = "b3-text-field fn__block";
        apiKeyInput.type = "password";
        apiKeyInput.autocomplete = "new-password";
        apiKeyInput.placeholder = this.i18n.settingsApiKeyPlaceholder;
        apiKeyInput.value = this.settings.firecrawlApiKey;

        const notebookSelect = document.createElement("select");
        notebookSelect.className = "b3-select fn__block";

        try {
            await this.refreshNotebooks(true);
        } catch (error) {
            showMessage(this.i18n.errorNotebookLoad);
        }
        this.populateNotebookSelect(
            notebookSelect,
            this.settings.defaultNotebookId,
            true,
        );

        this.setting = new Setting({
            confirmCallback: async () => {
                this.settings = {
                    ...this.settings,
                    firecrawlApiKey: apiKeyInput.value.trim(),
                    defaultNotebookId: notebookSelect.value,
                    defaultService: "firecrawl",
                };
                this.data[STORAGE_NAME] = {...this.settings};
                await this.saveData(STORAGE_NAME, this.settings);
                showMessage(this.i18n.settingsSaved);
            },
        });

        this.setting.addItem({
            title: this.i18n.settingsApiKeyTitle,
            description: this.i18n.settingsApiKeyDescription,
            createActionElement: () => apiKeyInput,
        });

        this.setting.addItem({
            title: this.i18n.settingsDefaultNotebookTitle,
            description: this.i18n.settingsDefaultNotebookDescription,
            createActionElement: () => notebookSelect,
        });
    }

    private async openFetchDialog() {
        await this.ensureSettings();

        const dialog = new Dialog({
            title: this.i18n.panelTitle,
            content: `<div class="web-fetch">
    <div class="web-fetch__card">
        <div class="web-fetch__field">
            <div class="web-fetch__label">${this.i18n.panelUrlLabel}</div>
            <input id="web-fetch-url" class="b3-text-field fn__block web-fetch__control" placeholder="${this.i18n.panelUrlPlaceholder}">
        </div>
        <div class="web-fetch__grid">
            <div class="web-fetch__field">
                <div class="web-fetch__label">${this.i18n.panelServiceLabel}</div>
                <select id="web-fetch-service" class="b3-select fn__block web-fetch__control">
                    <option value="firecrawl">${this.i18n.serviceFirecrawl}</option>
                </select>
            </div>
            <div class="web-fetch__field">
                <div class="web-fetch__label">${this.i18n.panelNotebookLabel}</div>
                <div class="web-fetch__notebook">
                    <select id="web-fetch-notebook" class="b3-select fn__block web-fetch__control"></select>
                    <button id="web-fetch-refresh" class="b3-button b3-button--outline web-fetch__refresh">${this.i18n.refreshNotebooks}</button>
                </div>
            </div>
        </div>
    </div>
    <div class="web-fetch__footer">
        <div id="web-fetch-status" class="web-fetch__status"></div>
        <div class="web-fetch__actions">
            <button id="web-fetch-cancel" class="b3-button b3-button--cancel">${this.i18n.cancel}</button>
            <button id="web-fetch-submit" class="b3-button b3-button--text">${this.i18n.panelFetchButton}</button>
        </div>
    </div>
</div>`,
            width: this.isMobile ? "92vw" : "520px",
        });

        const urlInput = dialog.element.querySelector(
            "#web-fetch-url",
        ) as HTMLInputElement;
        const serviceSelect = dialog.element.querySelector(
            "#web-fetch-service",
        ) as HTMLSelectElement;
        const notebookSelect = dialog.element.querySelector(
            "#web-fetch-notebook",
        ) as HTMLSelectElement;
        const refreshButton = dialog.element.querySelector(
            "#web-fetch-refresh",
        ) as HTMLButtonElement;
        const statusElement = dialog.element.querySelector(
            "#web-fetch-status",
        ) as HTMLDivElement;
        const cancelButton = dialog.element.querySelector(
            "#web-fetch-cancel",
        ) as HTMLButtonElement;
        const submitButton = dialog.element.querySelector(
            "#web-fetch-submit",
        ) as HTMLButtonElement;

        serviceSelect.value = this.settings.defaultService;

        const updateStatus = (text: string, isError = false) => {
            statusElement.textContent = text;
            statusElement.classList.toggle("web-fetch__status--error", isError);
        };

        const fillNotebooks = async (force = false) => {
            try {
                await this.refreshNotebooks(force);
                this.populateNotebookSelect(
                    notebookSelect,
                    this.settings.defaultNotebookId,
                    true,
                );
            } catch (error) {
                updateStatus(this.i18n.errorNotebookLoad, true);
            }
        };

        cancelButton.addEventListener("click", () => {
            dialog.destroy();
        });

        refreshButton.addEventListener("click", async () => {
            refreshButton.disabled = true;
            await fillNotebooks(true);
            refreshButton.disabled = false;
        });

        await fillNotebooks();

        submitButton.addEventListener("click", async () => {
            const url = urlInput.value.trim();
            const notebookId =
                notebookSelect.value || this.settings.defaultNotebookId;
            const service = serviceSelect.value as FetchService;

            if (!url) {
                updateStatus(this.i18n.errorMissingUrl, true);
                return;
            }
            if (!notebookId) {
                updateStatus(this.i18n.errorMissingNotebook, true);
                return;
            }
            if (!this.settings.firecrawlApiKey) {
                updateStatus(this.i18n.errorMissingApiKey, true);
                return;
            }
            if (service !== "firecrawl") {
                updateStatus(this.i18n.errorFetchFailed, true);
                return;
            }

            submitButton.disabled = true;
            refreshButton.disabled = true;
            updateStatus(this.i18n.statusFetching);

            try {
                const scrape = await scrapeFirecrawl(
                    url,
                    this.settings.firecrawlApiKey,
                );
                updateStatus(this.i18n.statusCreating);

                const markdown = this.buildMarkdown(
                    scrape.title,
                    scrape.sourceUrl,
                    scrape.markdown,
                );
                const docId = await this.createDoc(
                    notebookId,
                    scrape.title,
                    markdown,
                );

                updateStatus(this.i18n.statusDone);
                showMessage(this.i18n.statusDone);
                if (docId) {
                    openTab({
                        app: this.app,
                        doc: {id: docId},
                    });
                }
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                updateStatus(`${this.i18n.errorFetchFailed}: ${message}`, true);
                showMessage(`${this.i18n.errorFetchFailed}: ${message}`);
            } finally {
                submitButton.disabled = false;
                refreshButton.disabled = false;
            }
        });
    }

    private async refreshNotebooks(force = false) {
        if (!force && this.notebooks.length > 0) {
            return this.notebooks;
        }
        const data = await this.post<{notebooks?: NotebookInfo[]}>(
            "/api/notebook/lsNotebooks",
            {},
        );
        const notebooks = Array.isArray(data?.notebooks)
            ? data.notebooks
            : Array.isArray(data)
            ? (data as NotebookInfo[])
            : [];
        this.notebooks = notebooks;
        return this.notebooks;
    }

    private populateNotebookSelect(
        select: HTMLSelectElement,
        selectedId?: string,
        includePlaceholder = false,
    ) {
        select.innerHTML = "";
        if (includePlaceholder) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = this.i18n.selectNotebookPlaceholder;
            select.append(option);
        }

        this.notebooks.forEach((notebook) => {
            const option = document.createElement("option");
            option.value = notebook.id;
            option.textContent = notebook.name;
            select.append(option);
        });

        if (selectedId) {
            select.value = selectedId;
        }
    }

    private buildMarkdown(title: string, sourceUrl: string, body: string) {
        const safeTitle = title || sourceUrl;
        const trimmedBody = body.trim();
        const sourceLine = `${this.i18n.sourceLabel}: ${sourceUrl}`;
        const bodyContent = trimmedBody ? `\n\n${trimmedBody}` : "";
        return `# ${safeTitle}\n\n${sourceLine}${bodyContent}\n`;
    }

    private async createDoc(
        notebookId: string,
        title: string,
        markdown: string,
    ) {
        const safeTitle = this.sanitizeTitle(title);
        const data = await this.post<{id?: string; docID?: string}>(
            "/api/filetree/createDocWithMd",
            {
                notebook: notebookId,
                path: `/${safeTitle}`,
                markdown,
            },
        );
        return data?.id || data?.docID;
    }

    private sanitizeTitle(title: string) {
        const trimmed = title.trim() || "Untitled";
        const normalized = trimmed.replace(/[\\/:*?"<>|]/g, "-");
        return normalized.slice(0, 120);
    }

    private async post<T>(url: string, data: Record<string, unknown>) {
        return new Promise<T>((resolve, reject) => {
            fetchPost(url, data, (response) => {
                if (response?.code && response.code !== 0) {
                    reject(new Error(response.msg || "Request failed"));
                    return;
                }
                resolve(response?.data as T);
            });
        });
    }
}
