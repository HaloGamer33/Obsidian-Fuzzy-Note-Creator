import { Plugin, Notice, App, FuzzySuggestModal, SuggestModal, normalizePath, Instruction } from 'obsidian';
import { FuzzyNoteCreatorSettingTab, FuzzyNoteCreatorSettings, DEFAULT_SETTINGS } from './settingsTab'
import { readdirSync } from 'fs'

export default class FuzzyNoteCreatorPlugin extends Plugin {
    settings: FuzzyNoteCreatorSettings;

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new FuzzyNoteCreatorSettingTab(this.app, this));

        this.addCommand({
            id: 'new-tab',
            name: 'Note in new tab',
            callback: () => {
                new FolderSelectionModal(this.app, 'new-tab', this.settings).open();
            },
        });

        this.addCommand({
            id: 'current-tab',
            name: 'Note in current tab',
            callback: () => {
                new FolderSelectionModal(this.app, 'current-tab', this.settings).open();
            },
        });

        this.addCommand({
            id: 'new-window',
            name: 'Note in new window',
            callback: () => {
                new FolderSelectionModal(this.app, 'new-window', this.settings).open();
            },
        });

        this.addCommand({
            id: 'split-horizontal',
            name: 'Note in current window spliting horizontaly',
            callback: () => {
                new FolderSelectionModal(this.app, 'split-horizontal', this.settings).open();
            },
        });

        this.addCommand({
            id: 'split-vertical',
            name: 'Note in current window spliting verticaly',
            callback: () => {
                new FolderSelectionModal(this.app, 'split-vertical', this.settings).open();
            },
        });
        this.addCommand({
            id: 'bulk-new-tab',
            name: 'Bulk note creation in new tabs',
            callback: () => {
                new FolderSelectionModal(this.app, 'bulk-new-tab', this.settings).open();
            },
        });

        this.addCommand({
            id: 'bulk-current-tab',
            name: 'Bulk note creation in current tab',
            callback: () => {
                new FolderSelectionModal(this.app, 'bulk-current-tab', this.settings).open();
            },
        });

        this.addCommand({
            id: 'bulk-new-window',
            name: 'Bulk note creation in new windows',
            callback: () => {
                new FolderSelectionModal(this.app, 'bulk-new-window', this.settings).open();
            },
        });

        this.addCommand({
            id: 'bulk-split-horizontal',
            name: 'Bulk note creation in horizontal splits',
            callback: () => {
                new FolderSelectionModal(this.app, 'bulk-split-horizontal', this.settings).open();
            },
        });

        this.addCommand({
            id: 'bulk-split-vertical',
            name: 'Bulkn note creation in vertical splits',
            callback: () => {
                new FolderSelectionModal(this.app, 'bulk-split-vertical', this.settings).open();
            },
        });
    }
}

export class FolderSelectionModal extends FuzzySuggestModal<string> {
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

    getItems(): string[] {
        function getDirectories(source: string, foundDirs: string[]): string[] {
            let dirs = readdirSync(source, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            dirs = dirs.filter(directory => !directory.startsWith(`.`));
            dirs = dirs.map(dir => `${source.slice(path.length)}/${dir}`);

            if (dirs.length == 0) {
                return foundDirs;
            }

            foundDirs = foundDirs.concat(dirs);

            for (let i = 0; i < dirs.length; i++) {
                foundDirs = getDirectories(`${path}${dirs[i]}`, foundDirs);
            }

            return foundDirs;
        }

        let dirs: string[] = [];
        const path = this.app.vault.adapter.basePath;
        dirs = getDirectories(path, dirs);
        dirs = dirs.map(dir => dir.slice(1));
        dirs.push('/');
        return dirs;
    }

    getItemText(path: string): string {
        return path;
    }

    onChooseItem(path: string) {
        const normalizedPath = normalizePath(path);
        new NoteTitleModal(this.app, normalizedPath, this.leafMode, this.settings).open();
    }
}

export class NoteTitleModal extends SuggestModal<string> {
    constructor(app: App, path: string, leafMode: string, settings: FuzzyNoteCreatorSettings) {
        super(app)

        if (settings.showInstructions) {
            const instructions: Instruction[] = [
                {command: '↵', purpose: 'to create note'},
                {command: 'esc', purpose: 'to dismiss'},
                // {command: '/', purpose: 'to create parent folder of the note'},
            ];

            this.setInstructions(instructions);
        }

        this.setPlaceholder('Title of the note...');
        this.resultContainerEl.hide();

        let previousModalJustClosed = true;
        this.inputEl.addEventListener('keyup', async ({key}) => {
            if (key === 'Enter') {
                if (previousModalJustClosed) {
                    previousModalJustClosed = false;
                    return;
                }

                const untrimmedNoteName = this.inputEl.value;
                let noteName = untrimmedNoteName.trim();

                if (noteName.length == 0 && !settings.allowUntitledNotes) {
                    new Notice('Add a title to the note' , 2000);
                    return;
                }

                if (noteName.length == 0 && settings.allowUntitledNotes) {
                    noteName = (settings.untitledNoteName.length == 0) ? DEFAULT_SETTINGS.untitledNoteName! : settings.untitledNoteName!;
                }

                const windowsCompatibility: boolean = (
                    navigator.userAgent.toLowerCase().contains('windows') || settings.windowsNoteTitleCompatibility
                );

                if (windowsCompatibility && noteName.match(/(<|>|:|"|\||\?|\*)/) !== null) {
                    new Notice(`The note title must not include any of this characters: < > : " ? | *`, 2000);
                    return;
                }

                if (noteName.match(/^[\\\/\s]+$/)) {
                    new Notice(`The note title must not be only '\\' or '/'`);
                    return;
                }

                if (noteName.match(/(\/|\\)/) !== null) {
                    let noteNameWithDirs = normalizePath(noteName).split('/').map(link => link.trim()).filter(link => link.length !== 0);
                    let parentDirs = `${path}/`;
                    for (let i = 0; i < noteNameWithDirs.length - 1; i++) {
                        noteNameWithDirs[i] += '/';
                        parentDirs += noteNameWithDirs[i];
                    }
                    parentDirs = parentDirs.slice(0, -1);

                    if (this.app.vault.getFolderByPath(parentDirs) === null) {
                        this.app.vault.createFolder(parentDirs);
                    }
                    noteName = noteNameWithDirs.join('');
                }

                let noteExtension = settings.defaultNoteExtension;
                if (noteExtension.length == 0) {
                    noteExtension = DEFAULT_SETTINGS.defaultNoteExtension!;
                }

                if (navigator.userAgent.toLowerCase().contains('windows') && noteExtension.match(/(<|>|:|"|\\|\||\?|\/|\*|\/)/) !== null) {
                    new Notice(`The note extension must not include any of this characters: < > : " \ ? | * /`, 2000);
                    return;
                }

                if (noteExtension.match(/(\/)/) !== null) {
                    new Notice(`The note extension must not include the character: /`, 2000);
                    return;
                }

                const notePath = (path.length == 1) ? `${noteName}${noteExtension}` : `${path}/${noteName}${noteExtension}`;

                const normalizedNotePath= normalizePath(notePath);

                const fileAlreadyExists = (this.app.vault.getFileByPath(normalizedNotePath) !== null) ? true : false;

                if (fileAlreadyExists) {
                    new Notice(`That note already exists`, 2000);
                    return;
                }

                const newNote = await this.app.vault.create(`${normalizedNotePath}`, '');

                if (newNote == null) {
                    new Notice('Error opening the file, report issue to GitHub', 2000);
                    return;
                }

                if (newNote.extension !== 'md') {
                    new Notice(`Created note ${noteName}${noteExtension}, opening it on the system's default application if there is one`, 4000);
                }

                // this.app.workspace.getLeaf('window').openFile(newNote);
                switch (leafMode) {
                    case 'new-tab':
                        this.app.workspace.getLeaf('tab').openFile(newNote);
                        this.close();
                    break;
                    case 'current-tab':
                        this.app.workspace.getLeaf(false).openFile(newNote);
                        this.close();
                    break;
                    case 'new-window':
                        this.app.workspace.getLeaf('window').openFile(newNote);
                        this.close();
                    break;
                    case 'split-horizontal':
                        this.app.workspace.getLeaf('split', 'horizontal').openFile(newNote);
                        this.close();
                    break;
                    case 'split-vertical':
                        this.app.workspace.getLeaf('split', 'vertical').openFile(newNote);
                        this.close();
                    break;
                    case 'bulk-new-tab':
                        this.app.workspace.getLeaf('tab').openFile(newNote);
                    break;
                    case 'bulk-current-tab':
                        this.app.workspace.getLeaf(false).openFile(newNote);
                    break;
                    case 'bulk-new-window':
                        this.app.workspace.getLeaf('window').openFile(newNote);
                    break;
                    case 'bulk-split-horizontal':
                        this.app.workspace.getLeaf('split', 'horizontal').openFile(newNote);
                    break;
                    case 'bulk-split-vertical':
                        this.app.workspace.getLeaf('split', 'vertical').openFile(newNote);
                    break;
                }
                this.inputEl.value = '';
            }
        })
    }

    getSuggestions(): string[] {
        return [];
    }

    renderSuggestion() {
    }

    onChooseSuggestion() {
    }
}
