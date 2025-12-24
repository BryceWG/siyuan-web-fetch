import {NotebookInfo} from "../types/plugin";

export function extractNotebooks(data: unknown): NotebookInfo[] {
    const payload = data as {notebooks?: NotebookInfo[]};
    if (Array.isArray(payload?.notebooks)) {
        return payload.notebooks;
    }
    return Array.isArray(data) ? (data as NotebookInfo[]) : [];
}

export function populateNotebookSelect(
    select: HTMLSelectElement,
    notebooks: NotebookInfo[],
    selectedId?: string,
    includePlaceholder = false,
    placeholderText = "Select a notebook",
) {
    select.innerHTML = "";
    if (includePlaceholder) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = placeholderText;
        select.append(option);
    }

    notebooks.forEach((notebook) => {
        const option = document.createElement("option");
        option.value = notebook.id;
        option.textContent = notebook.name;
        select.append(option);
    });

    if (selectedId) {
        select.value = selectedId;
    }
}
