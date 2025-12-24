import {Setting, showMessage} from "siyuan";
import {NotebookInfo, PluginSettings, WebFetchI18n} from "../types/plugin";
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

    const setting = new Setting({
        confirmCallback: async () => {
            const nextSettings: PluginSettings = {
                ...context.settings,
                firecrawlApiKey: apiKeyInput.value.trim(),
                defaultNotebookId: notebookSelect.value,
                defaultService: "firecrawl",
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
        title: context.i18n.settingsDefaultNotebookTitle,
        description: context.i18n.settingsDefaultNotebookDescription,
        createActionElement: () => notebookSelect,
    });

    return setting;
}
