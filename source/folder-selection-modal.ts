import { App, FuzzySuggestModal, normalizePath, Instruction, TFolder } from 'obsidian';
import { FuzzyNoteCreatorSettings } from './settingsTab';
import { NoteCreationModal } from './note-creation-modal';

interface Suggestion {
    displayText: string
    path:        string
}

// Modals are elements in the UI that require interaction from the user
export class FolderSelectionModal extends FuzzySuggestModal<Suggestion> {
    settings: FuzzyNoteCreatorSettings;
    leafMode: string;

    constructor(app: App, leafMode: string, settings: FuzzyNoteCreatorSettings) {
        super(app)
        this.settings = settings;
        this.leafMode = leafMode;

        this.setPlaceholder('Path to the folder...');

        if (settings.showInstructions) {
            const instructions: Instruction[] = [
                {command: '↵', purpose: 'to select folder'},
                {command: 'esc', purpose: 'to dismiss'},
                {command: '↑↓', purpose: 'to navigate'},
                {command: '⭾ tab', purpose: 'to autocomplete folder'},
            ];

            this.setInstructions(instructions);
        }

        // Autocomplete selected folder with tab.
        this.inputEl.addEventListener('keydown', async (event: KeyboardEvent) => {
            if (event.key === 'Tab') {
                event.preventDefault();

                const suggestions = this.resultContainerEl.children;
                for (let i = 0; i < suggestions.length; i++) {
                    if (!suggestions[i].classList.contains('is-selected')) {
                        continue;
                    }

                    this.inputEl.value = suggestions[i].getText();
                    break;
                }
            }
        })
    }
    
    // ── End of constructor ──────────────────────────────────────────────

    // Get the folders in the vault
    getItems(): Suggestion[] {
        let dirs: Suggestion[] = [];

        const abstractFiles = this.app.vault.getAllLoadedFiles();
        for (let i = 0; i < abstractFiles.length; i++) {
            if (abstractFiles[i] instanceof TFolder) {
                dirs.push({
                    displayText: abstractFiles[i].path,
                    path:        abstractFiles[i].path,
                });
            }
        }

        if (this.settings.currentFolderRecommendation || this.settings.currentFolderFirst) {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) { return dirs }

            const currentPath = activeFile.parent!.path;

            if (this.settings.currentFolderRecommendation) {
                dirs.unshift({
                    displayText: this.settings.currentFolderRecommendationName,
                    path: currentPath,
                });
            }

            if (this.settings.currentFolderFirst) {
                dirs.unshift({
                    displayText: currentPath,
                    path: currentPath,
                })
            }
        }

        return dirs;
    }

    getItemText(suggestion: Suggestion): string {
        return suggestion.displayText;
    }

    onChooseItem(suggestion: Suggestion) {
        // normalizePath is an obsidian function (I still do some work to normalize the path down the line)
        const normalizedPath = normalizePath(suggestion.path);
        new NoteCreationModal(this.app, normalizedPath, this.leafMode, this.settings).open();
    }
}
