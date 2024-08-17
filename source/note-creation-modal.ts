import { Notice, App, SuggestModal, normalizePath, moment, Instruction, Platform } from 'obsidian';
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

    constructor(app: App, path: string, leafMode: string, settings: FuzzyNoteCreatorSettings, noteTemplate?: NoteTemplate) {
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
                {command: '↵', purpose: 'to create note'},
                {command: 'esc', purpose: 'to dismiss'},
                // {command: '/', purpose: 'to create parent folder of the note'},
            ];
            this.setInstructions(instructions);
        }

        let previousModalJustClosed = new BooleanWrapper(true);
        if (noteTemplate !== undefined) {
            this.inputEl.addEventListener('keyup', event => {
                this.usingTemplatesHandler(event, previousModalJustClosed)
            });
            return;
        }

        if (!settings.useNoteTitleTemplates) {
            this.inputEl.addEventListener('keyup', event => {
                this.enterKeyHandler(event, previousModalJustClosed)
            });
            return;
        }

        if (settings.useNoteTitleTemplates) {
            this.inputEl.addEventListener('keyup', event => {
                this.usingTemplatesHandler(event, previousModalJustClosed)
            });
            return;
        }
    }

    async usingTemplatesHandler(event: KeyboardEvent | MouseEvent, previousModalJustClosed: BooleanWrapper) {
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
            this.enterKeyHandler(event, previousModalJustClosed)
        }
    }

    getSuggestions(query: string): Suggestion[] {
        let suggestions: Suggestion[] = [];

        if (!this.settings.useNoteTitleTemplates && !this.settings.useNoteTemplates) {
            this.resultContainerEl.hide();
            return [];
        }

        if (this.noteTemplate !== undefined) {
            const noteTitleTemplates = this.settings.noteTitleTemplates.split('\n');
            const trimmedTemplates = noteTitleTemplates.map(template => template.trim())
            const filteredTemplates = trimmedTemplates.filter(template => {
                return template.toLowerCase().includes(query.toLowerCase());
            });

            const areThereTemplates = filteredTemplates[0] !== "";
            if (areThereTemplates) {
                for (let i = 0; i < filteredTemplates.length; i++) {
                    const currentTemplate = filteredTemplates[i];
                    const suggestion: Suggestion = {
                        text: currentTemplate,
                        type: "TitleTemplate",
                        query: query.trim(),
                    }
                    suggestions.push(suggestion);
                }
            }
            return suggestions;
        }

        if (this.settings.useNoteTitleTemplates) {
            const noteTitleTemplates = this.settings.noteTitleTemplates.split('\n');
            const trimmedTemplates = noteTitleTemplates.map(template => template.trim())
            const filteredTemplates = trimmedTemplates.filter(template => {
                return template.toLowerCase().includes(query.toLowerCase());
            });

            const areThereTemplates = filteredTemplates[0] !== "";
            if (areThereTemplates) {
                for (let i = 0; i < filteredTemplates.length; i++) {
                    const currentTemplate = filteredTemplates[i];
                    const suggestion: Suggestion = {
                        text: currentTemplate,
                        type: "TitleTemplate",
                        query: query.trim(),
                    }
                    suggestions.push(suggestion);
                }
            }
        }

        if (this.settings.useNoteTemplates) {
            const allNotes = this.app.vault.getFiles();
            const templatesFolder = this.settings.noteTemplatesFolder;
            let noteTemplatesFilePaths: string[] = [];

            for (let i = 0; i < allNotes.length; i++) {
                const currentNote = allNotes[i];
                const notePath = currentNote.path;

                if (notePath.startsWith(templatesFolder) === false) {
                    continue;
                }

                if (query.trim() === "") {
                    noteTemplatesFilePaths.push(notePath);
                    continue;
                }

                type queryWrapper = {
                    query: string;
                    found: boolean;
                }

                const queryWrappers: queryWrapper[] = query.trim().split(" ").map((query) => {return {query: query, found: false}});
                const pathElements = notePath.split(" ");
                // console.log(`\n\n\n-------------------\nNEW CYCLE`);
                // console.log(`Working with the note:\n\n${notePath}\n`);
                for (let p = 0; p < pathElements.length; p++) {
                    let headIndex: number = 0;
                    // console.log(`NEW CYCLE`);
                    for (let q = 0; q < queryWrappers.length; q++) {
                        // console.log(`current path element:`, pathElements[p]);
                        // console.log(`current query element:`, queryWrappers[q].query);
                        if (queryWrappers[q].found === true) {
                            // console.log("Already found, continuing");
                            // console.log(`\n`);
                            continue;
                        }

                        const indexOfQuery = pathElements[p].toLowerCase().indexOf(queryWrappers[q].query.toLowerCase(), headIndex);
                        if (indexOfQuery === -1) {
                            // console.log(`'${queryWrappers[q].query}' not found on '${pathElements[p].slice(headIndex)}', breaking.`);
                            // console.log(`\n`);
                            break;
                        }
                        // console.log(`'${queryWrappers[q].query}' found on '${pathElements[p].slice(headIndex)}'`);

                        headIndex = indexOfQuery + queryWrappers[q].query.length;
                        queryWrappers[q].found = true;
                        // console.log(`current wrapper:`, queryWrappers[q]);
                        // console.log(`\n`);
                    }

                    let allFound = true;
                    for (let t = 0; t < queryWrappers.length; t++) {
                        if (queryWrappers[t].found === false) {allFound = false}
                    }

                    if (allFound === true) {
                        noteTemplatesFilePaths.push(notePath);
                        // console.log(`All components have been found, breaking.`);
                        break;
                    }
                }
            }

            for (let i = 0; i < noteTemplatesFilePaths.length; i++) {
                const currentTemplate = noteTemplatesFilePaths[i];
                const suggestion: Suggestion = {
                    text: currentTemplate,
                    type: "NoteTemplate",
                    query: query.trim(),
                }
                suggestions.push(suggestion);
            }
        }
        return suggestions;
    }

    renderSuggestion(suggestion: Suggestion, el: HTMLElement) {
        if (suggestion.query === "") {
            el.createEl("div", {text: suggestion.text});
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
            const formatedNoteTitle = moment().format(suggestion.text)
            this.enterKeyHandler(evt, new BooleanWrapper(false), formatedNoteTitle)
        }

        if (suggestion.type === "NoteTemplate") {
            const template: NoteTemplate = {path: suggestion.text};
            new NoteCreationModal(this.app, this.path, this.leafMode, this.settings, template).open();
        }
    }

    async enterKeyHandler(event: KeyboardEvent | MouseEvent, previousModalJustClosed: BooleanWrapper, noteName?: string) {
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

            if (templateFile !== null) {
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
}
