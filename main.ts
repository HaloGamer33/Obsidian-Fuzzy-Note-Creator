import { Plugin, Notice, App, FuzzySuggestModal, SuggestModal, normalizePath }  from 'obsidian';
import { readdirSync } from 'fs'

export default class FuzzyNoteCreatorPlugin extends Plugin {
    async onload() {
        this.addCommand({
            id: 'open-fuzzy-note-creator',
            name: 'Open Fuzzy Note Creator',
            callback: () => {
                new FuzzyNoteCreatorModal(this.app).open();
            },
        });
    }
}

export class FuzzyNoteCreatorModal extends FuzzySuggestModal<string> {
    constructor(app: App) {
        super(app)
        this.inputEl.placeholder = 'Path to the folder...';
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

    onChooseItem(path: string, evt: MouseEvent | KeyboardEvent) {
        const normalizedPath = normalizePath(path);
        new NoteTitleModal(this.app, normalizedPath).open();
    }
}

export class NoteTitleModal extends SuggestModal<string> {
    constructor(app: App, path: string) {
        super(app)
        this.inputEl.placeholder = 'Title of the note...';
        this.resultContainerEl.outerHTML = '';

        let previousModalJustClosed = true;
        this.inputEl.addEventListener('keyup', async ({key}) => {
            if (key === 'Enter') {
                if (previousModalJustClosed) {
                    previousModalJustClosed = false;
                    return;
                }

                const untrimmedNoteName = this.inputEl.value;
                const noteName = untrimmedNoteName.trim();

                if (noteName.length == 0) {
                    new Notice('Add a title to the note' , 2000);
                    return;
                }

                if (navigator.platform == 'Win32' && noteName.match(/(<|>|:|"|\\|\||\?|\/|\*)/) !== null) {
                    new Notice(`The note title not must not include any of this characters: < > : " \ ? | / *`, 2000);
                    return;
                }

                if (noteName.match(/(\/)/) !== null) {
                    new Notice(`The note must not include the character: /`, 2000);
                    return;
                }

                const notePath = (path.length == 1) ? `${noteName}.md` : `${path}/${noteName}.md`;

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

                this.app.workspace.getLeaf(true).openFile(newNote);

                this.close();
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
