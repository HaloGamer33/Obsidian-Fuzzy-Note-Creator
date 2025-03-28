import { Notice, App, SuggestModal, normalizePath, moment, Instruction, Platform, TFile } from 'obsidian';
import { FuzzyNoteCreatorSettings, DEFAULT_SETTINGS } from './settingsTab';
import { OpenNote } from './open-note';

class BooleanWrapper {
    value: boolean;
    constructor(value: boolean) {
        this.value = value;
    }
}

type NoteType = "TitleTemplate" | "NoteTemplate";

type Suggestion = {
    text: string;
    template: string;
    type: NoteType;
    query?: string;
}

type NoteTemplate = {
    path: string;
}

export class NoteCreationModal extends SuggestModal<Suggestion> {
    settings: FuzzyNoteCreatorSettings;
    path: string;
    leafMode: string;
    noteTemplate: NoteTemplate;

    constructor(
        app: App,
        path: string,
        leafMode: string,
        settings: FuzzyNoteCreatorSettings,
        noteTemplate?: NoteTemplate
    ) {
        super(app)
        this.settings = settings
        this.path = path;
        this.leafMode = leafMode;

        this.emptyStateText = 'No templates found.';
        this.setPlaceholder('Title of the note...');

        if (noteTemplate !== undefined) {
            this.noteTemplate = noteTemplate;
        }

        if (settings.showInstructions) {
            const instructions: Instruction[] = [
                {command: '↵', purpose: 'to create note/select template'},
                {command: 'ctrl + ↵', purpose: 'to force create note'},
                {command: 'esc', purpose: 'to dismiss'},
                // {command: '/', purpose: 'to create parent folder of the note'},
            ];
            this.setInstructions(instructions);
        }

        let previousModalJustClosed = new BooleanWrapper(true);
        this.inputEl.addEventListener('keydown', event => {
            if (event.key == "Enter" && event.ctrlKey == true) {
                this.createNote(event, previousModalJustClosed);
            }
        });

        if (!settings.useNoteTitleTemplates) {
            this.inputEl.addEventListener('keyup', event => {
                this.createNote(event, previousModalJustClosed)
            });
            return;
        }

        if (settings.useNoteTitleTemplates || noteTemplate !== undefined) {
            this.inputEl.addEventListener('keyup', event => {
                this.emptySuggestionsCatcher(event, previousModalJustClosed)
            });
            return;
        }
    }

    getSuggestions(query: string): Suggestion[] {
        let suggestions: Suggestion[] = [];

        const noTemplatesEnabled = !this.settings.useNoteTitleTemplates && !this.settings.useNoteTemplates;
        if (noTemplatesEnabled) {
            this.resultContainerEl.hide();
            return [];
        }

        if (this.settings.useNoteTitleTemplates) {
            const titleTemplates = this.settings.noteTitleTemplates.split('\n');
            const templates = titleTemplates.map(template => template.trim())

            for (let i = 0; i < templates.length; i++) {
                const currentTemplate = templates[i];
                const momentFormatedName = moment().format(currentTemplate);
                const trimmedQuery = query.trim();
                const querySplit = trimmedQuery.split(' ');
                const queryElements: queryWrapper[] = querySplit.map(query => {
                    return {
                        query: query,
                        found: false
                    }
                });
                const templateSuggestion = `Title Template: ${momentFormatedName}`;
                const suggestionElements = templateSuggestion.split(' ');

                if (allQueryElementsFound(queryElements, suggestionElements)) {
                    const suggestion: Suggestion = {
                        text: `Title Template: ${momentFormatedName}`,
                        template: currentTemplate,
                        type: 'TitleTemplate',
                        query: query.trim(),
                    }
                    suggestions.push(suggestion);
                }
            }
        }

        const skipBodyTemplate = this.noteTemplate !== undefined;
        if (skipBodyTemplate) { return suggestions; }

        if (this.settings.useNoteTemplates) {
            const templatesFolderPath = this.settings.noteTemplatesFolder;
            const templatesFolder = this.app.vault.getFolderByPath(templatesFolderPath);
            const folderContents = templatesFolder!.children;
            const bodyTemplates = folderContents.filter(abstractFile => {
                return abstractFile instanceof TFile;
            });

            for (let i = 0; i < bodyTemplates.length; i++) {
                const currentNote = bodyTemplates[i];
                const notePath = currentNote.path;
                const trimmedQuery = query.trim();
                const querySplit = trimmedQuery.split(' ');
                const queryElements: queryWrapper[] = querySplit.map(query => {
                    return {
                        query: query,
                        found: false
                    }
                });
                const templateSuggestion = `Note Template: ${notePath}`;
                const suggestionElements = templateSuggestion.split(' ');

                if (allQueryElementsFound(queryElements, suggestionElements)) {
                    const currentTemplate = notePath;
                    const suggestion: Suggestion = {
                        text: `Note Template: ${currentTemplate}`,
                        template: currentTemplate,
                        type: 'NoteTemplate',
                        query: query.trim(),
                    }
                    suggestions.push(suggestion);
                }
            }
        }

        return suggestions;

        type queryWrapper = {
            query: string;
            found: boolean;
        }

        function allQueryElementsFound(
            queryWrappers: queryWrapper[],
            suggestionElements: string[]
        ) {
            for (let p = 0; p < suggestionElements.length; p++) {
                let headIndex = 0;
                for (let q = 0; q < queryWrappers.length; q++) {
                    if (queryWrappers[q].found) continue;

                    const indexOfQuery = suggestionElements[p].toLowerCase().indexOf(queryWrappers[q].query.toLowerCase(), headIndex);
                    if (indexOfQuery === -1) break;

                    headIndex = indexOfQuery + queryWrappers[q].query.length;
                    queryWrappers[q].found = true;
                }

                if (queryWrappers.every(wrapper => wrapper.found)) {
                    return true;
                }
            }
            return false;
        }
    }

    renderSuggestion(suggestion: Suggestion, el: HTMLElement) {
        if (suggestion.query === '') {
            switch (suggestion.type) {
                //TODO: Add bold to the text that shows which type of template it is
                case 'TitleTemplate':
                    el.createEl('span', {cls: 'suggestion-highlight', text: `Title Template: `});
                    el.createEl('span', {text: `${moment().format(suggestion.template)}`});
                    break;
                case 'NoteTemplate':
                    el.createEl('span', {cls: 'suggestion-highlight', text: `Note Template: `});
                    el.createEl('span', {text: `${suggestion.template}`});
                    break;
            }
        }

        function escapeRegExp(str: string): string {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        if (suggestion.query !== undefined && suggestion.query !== "") {
            const queryElements = suggestion.query.split(" ").filter((suggestion) => {return suggestion !== "";});

            let startIndex = 0;
            const parentDiv = el.createEl("div");
            for (let i = 0; i < queryElements.length; i++) {
                const regex = new RegExp(escapeRegExp(String.raw`${queryElements[i]}`), "gi");
                let match;
                match = regex.exec(suggestion.text.slice(startIndex))
                if (match !== null) {
                    parentDiv.createEl("span", {text: suggestion.text.slice(startIndex, match.index + startIndex)});
                    parentDiv.createEl("span", {text: suggestion.text.slice(match.index + startIndex, queryElements[i].length + startIndex + match.index), cls: "suggestion-highlight"});
                    startIndex += queryElements[i].length + match.index;
                }
            }

            if (startIndex !== suggestion.text.length) {
                parentDiv.createEl("span", {text: suggestion.text.slice(startIndex)});
            }
        }
    }

    onChooseSuggestion(suggestion: Suggestion, evt: MouseEvent | KeyboardEvent) {
        if (suggestion.type === "TitleTemplate") {
            const formatedNoteTitle = moment().format(suggestion.template)
            this.createNote(evt, new BooleanWrapper(false), formatedNoteTitle)
        }

        if (suggestion.type === "NoteTemplate") {
            const template: NoteTemplate = {path: suggestion.template};
            new NoteCreationModal(this.app, this.path, this.leafMode, this.settings, template).open();
        }
    }

    // ╭─────────────────────────────────────────────────────────╮
    // │                   Call Back Functions                   │
    // ╰─────────────────────────────────────────────────────────╯

    //  ── Create Note Call Back ───────────────────────────────────────────

    async createNote(event: KeyboardEvent | MouseEvent, previousModalJustClosed: BooleanWrapper, noteName?: string) {
        const isKeyboardEvent = (event: KeyboardEvent | MouseEvent): event is KeyboardEvent => "key" in event;

        if(isKeyboardEvent(event)) {
            const {key} = event;
            if (key !== 'Enter') { 
                return 
            }
        }

        // Check to see if the previous menu has just closed, to prevent
        // a ghost enter that creates a untitled note.
        
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

        if (this.app.vault.getFolderByPath(this.path) === null) {
            this.app.vault.createFolder(this.path);
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

        let fileAlreadyExists = false;
        const loadedFiles = this.app.vault.getFiles();
        for (let i = 0; i < loadedFiles.length; i++) {
            if (loadedFiles[i].path.toLowerCase() === normalizedNotePath.toLowerCase()) {
                fileAlreadyExists = true;
            }
        }

        if (fileAlreadyExists) {
            new Notice(`That note already exists`, 2000);
            return;
        }

        let noteContents = "";
        if (this.noteTemplate !== undefined) {
            const noteTemplatePath = this.noteTemplate.path;
            const templateFile = this.app.vault.getFileByPath(noteTemplatePath);

            if (templateFile == null) { return; }

            noteContents = await this.app.vault.read(templateFile);

            const timeFormat = this.settings.timeFormat;
            const dateFormat = this.settings.dateFormat;

            const validTimeFormat = (timeFormat === undefined || timeFormat === "") ? "HH:mm" : timeFormat;
            const validDateFormat = (dateFormat === undefined || dateFormat === "") ? "YYYY-MM-DD" : dateFormat;

            const formatedTime = moment().format(validTimeFormat);
            const formatedDate = moment().format(validDateFormat);

            noteContents = noteContents.replace(/{{time}}/g, formatedTime);
            noteContents = noteContents.replace(/{{date}}/g, formatedDate);

            const overrideDateRegex = new RegExp(String.raw`{{date:(.+)}}`, "g");
            const overrideTimeRegex = new RegExp(String.raw`{{time:(.+)}}`, "g");

            const matchesDate = noteContents.matchAll(overrideDateRegex);
            const matchesTime = noteContents.matchAll(overrideTimeRegex);

            if (matchesDate !== null) {
                const matchesArray = [...matchesDate];
                for (let i = 0; i < matchesArray.length; i++) {
                    const override = matchesArray[i][0];
                    const format = matchesArray[i][1];

                    noteContents = noteContents.replace(override, moment().format(format));
                }
            }

            if (matchesTime !== null) {
                const matchesArray = [...matchesTime];
                for (let i = 0; i < matchesArray.length; i++) {
                    const override = matchesArray[i][0];
                    const format = matchesArray[i][1];

                    noteContents = noteContents.replace(override, moment().format(format));
                }
            }
        }

        const newNote = await this.app.vault.create(`${normalizedNotePath}`, noteContents);

        if (newNote == null) {
            new Notice('Error opening the file, report issue to GitHub', 2000);
            return;
        }

        if (newNote.extension !== 'md') {
            new Notice(`Created note ${noteName}${noteExtension}, opening it on the system's default application if there is one`, 4000);
        }

        OpenNote.bind(this)(newNote);
    }

    //  ── Empty Suggestions Catcher ───────────────────────────────────────

    async emptySuggestionsCatcher(event: KeyboardEvent | MouseEvent, previousModalJustClosed: BooleanWrapper) {
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

        /* This only triggers if the user pressed 'enter' when no suggestion was displayed,
        * aka: doesn't want to use any template and wants to create a blank note. Otherwise
        * the program goes to the function 'OnChooseSuggestion' */
        if (this.getSuggestions(this.inputEl.value).length === 0) {
            this.createNote(event, previousModalJustClosed)
        }
    }
}
