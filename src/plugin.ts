import {getFrontend, Plugin} from "siyuan";
import {postSiyuan} from "./api/siyuan";
import {createSettingsPanel} from "./components/settings-panel";
import {DEFAULT_SETTINGS, STORAGE_NAME} from "./constants";
import {openFetchDialog} from "./components/fetch-dialog";
import {NotebookInfo, PluginSettings} from "./types/plugin";
import {sanitizeTitle} from "./utils/markdown";
import {extractNotebooks} from "./utils/notebooks";

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
        this.setting = await createSettingsPanel({
            i18n: this.i18n,
            settings: this.settings,
            refreshNotebooks: this.refreshNotebooks.bind(this),
            getNotebooks: () => this.notebooks,
            onSave: async (nextSettings) => {
                this.settings = nextSettings;
                this.data[STORAGE_NAME] = {...nextSettings};
                await this.saveData(STORAGE_NAME, nextSettings);
            },
        });
    }

    private async openFetchDialog() {
        await this.ensureSettings();
        await openFetchDialog({
            app: this.app,
            i18n: this.i18n,
            isMobile: this.isMobile,
            settings: this.settings,
            refreshNotebooks: this.refreshNotebooks.bind(this),
            getNotebooks: () => this.notebooks,
            createDoc: this.createDoc.bind(this),
        });
    }

    private async refreshNotebooks(force = false) {
        if (!force && this.notebooks.length > 0) {
            return this.notebooks;
        }
        const data = await postSiyuan<unknown>(
            "/api/notebook/lsNotebooks",
            {},
        );
        this.notebooks = extractNotebooks(data);
        return this.notebooks;
    }

    private async createDoc(
        notebookId: string,
        title: string,
        markdown: string,
    ) {
        const safeTitle = sanitizeTitle(title);
        const data = await postSiyuan<{id?: string; docID?: string}>(
            "/api/filetree/createDocWithMd",
            {
                notebook: notebookId,
                path: `/${safeTitle}`,
                markdown,
            },
        );
        return data?.id || data?.docID;
    }
}
