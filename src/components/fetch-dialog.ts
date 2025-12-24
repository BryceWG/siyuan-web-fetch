import {Dialog, openTab, showMessage} from "siyuan";
import {scrapeFirecrawl} from "../services/firecrawl";
import {NotebookInfo, PluginSettings, WebFetchI18n} from "../types/plugin";
import {buildMarkdown} from "../utils/markdown";
import {populateNotebookSelect} from "../utils/notebooks";

type OpenTabOptions = Parameters<typeof openTab>[0];

interface FetchDialogContext {
    app: OpenTabOptions["app"];
    i18n: WebFetchI18n;
    isMobile: boolean;
    settings: PluginSettings;
    refreshNotebooks: (force?: boolean) => Promise<NotebookInfo[]>;
    getNotebooks: () => NotebookInfo[];
    createDoc: (
        notebookId: string,
        title: string,
        markdown: string,
    ) => Promise<string | undefined>;
}

export async function openFetchDialog(context: FetchDialogContext) {
    const dialog = new Dialog({
        title: context.i18n.panelTitle,
        content: `<div class="web-fetch">
    <div class="web-fetch__card">
        <div class="web-fetch__field">
            <div class="web-fetch__label">${context.i18n.panelUrlLabel}</div>
            <input id="web-fetch-url" class="b3-text-field fn__block web-fetch__control" placeholder="${context.i18n.panelUrlPlaceholder}">
        </div>
        <div class="web-fetch__grid">
            <div class="web-fetch__field">
                <div class="web-fetch__label">${context.i18n.panelServiceLabel}</div>
                <select id="web-fetch-service" class="b3-select fn__block web-fetch__control">
                    <option value="firecrawl">${context.i18n.serviceFirecrawl}</option>
                </select>
            </div>
            <div class="web-fetch__field">
                <div class="web-fetch__label">${context.i18n.panelNotebookLabel}</div>
                <div class="web-fetch__notebook">
                    <select id="web-fetch-notebook" class="b3-select fn__block web-fetch__control"></select>
                    <button id="web-fetch-refresh" class="b3-button b3-button--outline web-fetch__refresh">${context.i18n.refreshNotebooks}</button>
                </div>
            </div>
        </div>
    </div>
    <div class="web-fetch__footer">
        <div id="web-fetch-status" class="web-fetch__status"></div>
        <div class="web-fetch__actions">
            <button id="web-fetch-cancel" class="b3-button b3-button--cancel">${context.i18n.cancel}</button>
            <button id="web-fetch-submit" class="b3-button b3-button--text">${context.i18n.panelFetchButton}</button>
        </div>
    </div>
</div>`,
        width: context.isMobile ? "92vw" : "520px",
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

    serviceSelect.value = context.settings.defaultService;

    const updateStatus = (text: string, isError = false) => {
        statusElement.textContent = text;
        statusElement.classList.toggle("web-fetch__status--error", isError);
    };

    const fillNotebooks = async (force = false) => {
        try {
            await context.refreshNotebooks(force);
            populateNotebookSelect(
                notebookSelect,
                context.getNotebooks(),
                context.settings.defaultNotebookId,
                true,
                context.i18n.selectNotebookPlaceholder,
            );
        } catch (error) {
            updateStatus(context.i18n.errorNotebookLoad, true);
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
            notebookSelect.value || context.settings.defaultNotebookId;
        const service = serviceSelect.value;

        if (!url) {
            updateStatus(context.i18n.errorMissingUrl, true);
            return;
        }
        if (!notebookId) {
            updateStatus(context.i18n.errorMissingNotebook, true);
            return;
        }
        if (!context.settings.firecrawlApiKey) {
            updateStatus(context.i18n.errorMissingApiKey, true);
            return;
        }
        if (service !== "firecrawl") {
            updateStatus(context.i18n.errorFetchFailed, true);
            return;
        }

        submitButton.disabled = true;
        refreshButton.disabled = true;
        updateStatus(context.i18n.statusFetching);

        try {
            const scrape = await scrapeFirecrawl(
                url,
                context.settings.firecrawlApiKey,
            );
            updateStatus(context.i18n.statusCreating);

            const markdown = buildMarkdown(
                scrape.title,
                scrape.sourceUrl,
                scrape.markdown,
                context.i18n.sourceLabel,
            );
            const docId = await context.createDoc(
                notebookId,
                scrape.title,
                markdown,
            );

            updateStatus(context.i18n.statusDone);
            showMessage(context.i18n.statusDone);
            if (docId) {
                openTab({
                    app: context.app,
                    doc: {id: docId},
                });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            updateStatus(`${context.i18n.errorFetchFailed}: ${message}`, true);
            showMessage(`${context.i18n.errorFetchFailed}: ${message}`);
        } finally {
            submitButton.disabled = false;
            refreshButton.disabled = false;
        }
    });
}
