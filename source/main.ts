import { Plugin, Notice, App, FuzzySuggestModal, SuggestModal, normalizePath, moment, Instruction, Platform, TFolder } from 'obsidian';
import { FuzzyNoteCreatorSettingTab, FuzzyNoteCreatorSettings, DEFAULT_SETTINGS } from './settingsTab';
import { AddCommands } from './commands';
import { OpenNote } from './open-note';

export default class FuzzyNoteCreatorPlugin extends Plugin {
    settings: FuzzyNoteCreatorSettings;

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

        this.addSettingTab(new FuzzyNoteCreatorSettingTab(this.app, this));

        AddCommands.bind(this)();
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
        let dirs: string[] = [];

        const abstractFiles = this.app.vault.getAllLoadedFiles();
        for (let i = 0; i < abstractFiles.length; i++) {
            if (abstractFiles[i] instanceof TFolder) {
                dirs.push(abstractFiles[i].path);
            }
        }

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
    settings: FuzzyNoteCreatorSettings;
    path: string;
    leafMode: string;

    constructor(app: App, path: string, leafMode: string, settings: FuzzyNoteCreatorSettings) {
        super(app)
        this.settings = settings
        this.path = path;
        this.leafMode = leafMode;

        if (settings.showInstructions) {
            const instructions: Instruction[] = [
                {command: '↵', purpose: 'to create note'},
                {command: 'esc', purpose: 'to dismiss'},
                // {command: '/', purpose: 'to create parent folder of the note'},
            ];

            this.setInstructions(instructions);
        }
        this.emptyStateText = 'No templates found.';
        this.setPlaceholder('Title of the note...');

        if (!settings.useNoteTitleTemplates) {
            let previousModalJustClosed = new BooleanWrapper(true);
            this.inputEl.addEventListener('keyup', event => {
                this.handleEnterKey(event, previousModalJustClosed)
            });
            return;
        }

        if (settings.useNoteTitleTemplates) {
            let previousModalJustClosed = new BooleanWrapper(true);
            this.inputEl.addEventListener('keyup', event => {
                this.noTemplatesNoteCreation(event, previousModalJustClosed)
            });
            return;
        }
    }

    async noTemplatesNoteCreation(event: KeyboardEvent | MouseEvent, previousModalJustClosed: BooleanWrapper) {
        const isKeyboardEvent = (event: KeyboardEvent | MouseEvent): event is KeyboardEvent => "key" in event;

        if(isKeyboardEvent(event)) {
            const {key} = event;
            if (key !== 'Enter') { 
                return 
            }
        }

        if (previousModalJustClosed.value) {
            previousModalJustClosed.value = false;
            return;
        }

        if (this.getSuggestions(this.inputEl.value).length === 0) {
            this.handleEnterKey(event, previousModalJustClosed)
        }
    }

    getSuggestions(query: string): string[] {
        if (!this.settings.useNoteTitleTemplates) {
            this.resultContainerEl.hide();
            return [];
        }
        if (this.settings.noteTitleTemplates === '' || this.settings.noteTitleTemplates === undefined) {
            return [];
        }

        const templates = this.settings.noteTitleTemplates.split('\n');
        const trimmedTemplates = templates.map(template => template.trim())
        return trimmedTemplates.filter(template => {
            return template.toLowerCase().includes(query.toLowerCase());
        });
    }

    renderSuggestion(template: string, el: HTMLElement) {
        el.createEl('div', {text: template});
    }

    onChooseSuggestion(noteName: string, evt: MouseEvent | KeyboardEvent) {
        const formatedNoteName = moment().format(noteName)

        this.handleEnterKey(evt, new BooleanWrapper(false), formatedNoteName)
    }

    async handleEnterKey(event: KeyboardEvent | MouseEvent, previousModalJustClosed: BooleanWrapper, noteName?: string) {
        const isKeyboardEvent = (event: KeyboardEvent | MouseEvent): event is KeyboardEvent => "key" in event;

        if(isKeyboardEvent(event)) {
            const {key} = event;
            if (key !== 'Enter') { 
                return 
            }
        }

        if (previousModalJustClosed.value) {
            previousModalJustClosed.value = false;
            return;
        }

        if (noteName === undefined) {
            noteName = this.inputEl.value;
        }

        noteName = noteName.trim();

        if (noteName.length == 0 && !this.settings.allowUntitledNotes) {
            new Notice('Add a title to the note' , 2000);
            return;
        }

        if (noteName.length == 0 && this.settings.allowUntitledNotes) {
            noteName = (this.settings.untitledNoteName.length == 0) ? DEFAULT_SETTINGS.untitledNoteName! : this.settings.untitledNoteName!;
        }

        const windowsCompatibility: boolean = (
            Platform.isWin || this.settings.windowsNoteTitleCompatibility
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
            let parentDirs = `${this.path}/`;
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

        let noteExtension = this.settings.defaultNoteExtension;
        if (noteExtension.length == 0) {
            noteExtension = DEFAULT_SETTINGS.defaultNoteExtension!;
        }

        if (windowsCompatibility && noteExtension.match(/(<|>|:|"|\\|\||\?|\/|\*|\/)/) !== null) {
            new Notice(`The note extension must not include any of this characters: < > : " \ ? | * /`, 2000);
            return;
        }

        if (noteExtension.match(/(\/)/) !== null) {
            new Notice(`The note extension must not include the character: /`, 2000);
            return;
        }

        const notePath = (this.path.length == 1) ? `${noteName}${noteExtension}` : `${this.path}/${noteName}${noteExtension}`;

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

        OpenNote.bind(this)(newNote);
    }
}

class BooleanWrapper {
    value: boolean;
    constructor(value: boolean) {
        this.value = value;
    }
}
