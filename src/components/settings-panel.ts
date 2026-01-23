import {Setting, showMessage} from "siyuan";
import {
    FetchService,
    NotebookInfo,
    PluginSettings,
    WebFetchI18n,
} from "../types/plugin";
import {populateNotebookSelect} from "../utils/notebooks";

interface SettingsPanelContext {
    i18n: WebFetchI18n;
    settings: PluginSettings;
    refreshNotebooks: (force?: boolean) => Promise<NotebookInfo[]>;
    getNotebooks: () => NotebookInfo[];
    onSave: (nextSettings: PluginSettings) => Promise<void>;
}

export async function createSettingsPanel(
    context: SettingsPanelContext,
): Promise<Setting> {
    const apiKeyInput = document.createElement("input");
    apiKeyInput.className = "b3-text-field fn__block";
    apiKeyInput.type = "password";
    apiKeyInput.autocomplete = "new-password";
    apiKeyInput.placeholder = context.i18n.settingsApiKeyPlaceholder;
    apiKeyInput.value = context.settings.firecrawlApiKey;

    const endpointInput = document.createElement("input");
    endpointInput.className = "b3-text-field fn__block";
    endpointInput.type = "text";
    endpointInput.placeholder = context.i18n.settingsFirecrawlEndpointPlaceholder;
    endpointInput.value = context.settings.firecrawlEndpoint;

    const serviceSelect = document.createElement("select");
    serviceSelect.className = "b3-select fn__block";
    const firecrawlOption = document.createElement("option");
    firecrawlOption.value = "firecrawl";
    firecrawlOption.textContent = context.i18n.serviceFirecrawl;
    const jinaOption = document.createElement("option");
    jinaOption.value = "jina";
    jinaOption.textContent = context.i18n.serviceJina;
    serviceSelect.append(firecrawlOption, jinaOption);
    serviceSelect.value = context.settings.defaultService;

    const notebookSelect = document.createElement("select");
    notebookSelect.className = "b3-select fn__block";

    try {
        await context.refreshNotebooks(true);
    } catch (error) {
        showMessage(context.i18n.errorNotebookLoad);
    }

    populateNotebookSelect(
        notebookSelect,
        context.getNotebooks(),
        context.settings.defaultNotebookId,
        true,
        context.i18n.selectNotebookPlaceholder,
    );

    const autoOpenNoteCheckbox = document.createElement("input");
    autoOpenNoteCheckbox.type = "checkbox";
    autoOpenNoteCheckbox.className = "b3-switch fn__flex-center";
    autoOpenNoteCheckbox.checked = context.settings.autoOpenNote;

    const setting = new Setting({
        confirmCallback: async () => {
            const nextSettings: PluginSettings = {
                ...context.settings,
                firecrawlApiKey: apiKeyInput.value.trim(),
                firecrawlEndpoint: endpointInput.value.trim(),
                defaultNotebookId: notebookSelect.value,
                defaultService: serviceSelect.value as FetchService,
                autoOpenNote: autoOpenNoteCheckbox.checked,
            };
            context.settings = nextSettings;
            await context.onSave(nextSettings);
            showMessage(context.i18n.settingsSaved);
        },
    });

    setting.addItem({
        title: context.i18n.settingsApiKeyTitle,
        description: context.i18n.settingsApiKeyDescription,
        createActionElement: () => apiKeyInput,
    });

    setting.addItem({
        title: context.i18n.settingsFirecrawlEndpointTitle,
        description: context.i18n.settingsFirecrawlEndpointDescription,
        createActionElement: () => endpointInput,
    });

    setting.addItem({
        title: context.i18n.settingsDefaultServiceTitle,
        description: context.i18n.settingsDefaultServiceDescription,
        createActionElement: () => serviceSelect,
    });

    setting.addItem({
        title: context.i18n.settingsDefaultNotebookTitle,
        description: context.i18n.settingsDefaultNotebookDescription,
        createActionElement: () => notebookSelect,
    });

    setting.addItem({
        title: context.i18n.settingsAutoOpenNoteTitle,
        description: context.i18n.settingsAutoOpenNoteDescription,
        createActionElement: () => autoOpenNoteCheckbox,
    });

    return setting;
}
