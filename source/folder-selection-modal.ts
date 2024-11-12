import { App, FuzzySuggestModal, normalizePath, Instruction, TFolder, Platform, Notice } from 'obsidian';
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
    dirs: Suggestion[];
    newDirSuggestion: Suggestion;

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

                    this.inputEl.value = suggestions[i].getText().replace(' Press ↵ to create folder.', '');

                    // Trigger an input event to update suggestions
                    const event = new Event('input', { bubbles: true, cancelable: true });
                    this.inputEl.dispatchEvent(event);

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

        this.dirs = dirs;
        return dirs;
    }

    getItemText(suggestion: Suggestion): string {
        return suggestion.displayText;
    }

    onChooseItem(suggestion: Suggestion) {
        // normalizePath is an obsidian function (I still do some work to normalize the path down the line)
        if (this.newDirSuggestion) {
            let path = normalizePath(this.newDirSuggestion.path);
            const windowsCompatibility: boolean = (
                Platform.isWin || this.settings.windowsNoteTitleCompatibility
            );

            path = path.replace('\\', '/')
            let pathArray = path.split('/').map(link => link.trim()).filter(link => link.length !== 0);
            path = pathArray.join('/');

            if (windowsCompatibility && path.match(/(<|>|:|"|\||\?|\*)/) !== null) {
                new Notice(`The note title must not include any of this characters: < > : " ? | *`, 2000);
                new FolderSelectionModal(this.app, this.leafMode, this.settings).open();
                return;
            }

            new NoteCreationModal(this.app, path, this.leafMode, this.settings).open();
            return;
        }

        const normalizedPath = normalizePath(suggestion.path);
        new NoteCreationModal(this.app, normalizedPath, this.leafMode, this.settings).open();
    }

    onNoSuggestion() {
        this.resultContainerEl.replaceChildren();
        const input = this.inputEl.value; 
        const dirs = this.dirs.filter(dir => {
            if (dir.path != '/') {
                dir.path += '/';
            }
            return dir;
        })

        const existingDirs = dirs.filter(dir => {
            if (input.startsWith(dir.path)) {
                return true;
            }
        })

        let longestDir = '';
        for (let i = 0; i < existingDirs.length; i++) {
            if (existingDirs[i].path.length > longestDir.length) {
                longestDir = existingDirs[i].path;
            }
        }
      
        const newDir = input.replace(longestDir, '');
        const existingDir = longestDir;

        const newDirSuggestion = this.resultContainerEl.createDiv({cls: ['suggestion-item', 'is-selected']});

        newDirSuggestion.createEl('span', {text: existingDir});
        newDirSuggestion.createEl('span', {cls: 'suggestion-highlight', text: newDir});
        newDirSuggestion.createEl('kbd', {text: ' Press ↵ to create folder.'});

        this.newDirSuggestion = {
            displayText: `${existingDir}${newDir}`,
            path: `${existingDir}${newDir}`
        }

        // console.log(this.newDirSuggestion);
    }
}
