import FuzzyNoteCreatorPlugin from './main';
import { App, PluginSettingTab, Setting, Platform, moment } from 'obsidian';
import { OverrideNewNote, RestoreNewNote } from './override-new-note';

export interface FuzzyNoteCreatorSettings {
    showInstructions: boolean;
    windowsNoteTitleCompatibility: boolean;
    allowUntitledNotes: boolean;
    defaultNoteExtension: string;
    untitledNoteName: string;
    usingTitleTemplates: boolean;
    titleTemplates: string;
    usingNoteTemplates: boolean;
    noteTemplatesFolder: string;
    dateFormat: string;
    timeFormat: string;
    overrideNewNote: boolean;
    overrideCommand: string;
    currentFolderFirst: boolean;
    currentFolderRecommendation: boolean;
    currentFolderRecommendationName: string;
}

export const DEFAULT_SETTINGS: Partial<FuzzyNoteCreatorSettings> = {
    showInstructions: true,
    windowsNoteTitleCompatibility: false,
    allowUntitledNotes: true,
    defaultNoteExtension: '.md',
    untitledNoteName: 'Untitled',
    usingTitleTemplates: false,
    usingNoteTemplates: false,
    overrideNewNote: false,
    overrideCommand: 'new-note',
    currentFolderFirst: true,
    currentFolderRecommendation: false,
    currentFolderRecommendationName: 'Current Folder',
};

export class FuzzyNoteCreatorSettingTab extends PluginSettingTab {
    plugin: FuzzyNoteCreatorPlugin;
    app: App;

    constructor(app: App, plugin: FuzzyNoteCreatorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.app = app;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        // ╭─────────────────────────────────────────────────────────╮
        // │                    General Settings                     │
        // ╰─────────────────────────────────────────────────────────╯

        new Setting(containerEl)
            .setName('Show instructions')
            .setDesc(
                'Whether to show the instructions on how to use the plugin when using it',
            )
            .addToggle((slider) => {
                slider
                    .setValue(this.plugin.settings.showInstructions)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.showInstructions = value;
                        await this.plugin.saveSettings();
                    });
            });

        if (!Platform.isWin) {
            new Setting(containerEl)
                .setName('Windows note title compatibility')
                .setDesc(
                    "When turned on, the plugin won't allow you to title notes with Window's illegal characters even if you are not on Windows. If running on windows this setting has no effect.",
                )
                .addToggle((slider) => {
                    slider
                        .setValue(
                            this.plugin.settings.windowsNoteTitleCompatibility,
                        )
                        .onChange(async (value: boolean) => {
                            this.plugin.settings.windowsNoteTitleCompatibility =
                                value;
                            await this.plugin.saveSettings();
                        });
                });
        }

        new Setting(containerEl)
            .setName('File extension')
            .setDesc('Default file extension of the notes')
            .addText((text) => {
                text.setPlaceholder('.md')
                    .setValue(this.plugin.settings.defaultNoteExtension)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultNoteExtension =
                            value.trim();
                        await this.plugin.saveSettings();
                    });
            });

        // ╭─────────────────────────────────────────────────────────╮
        // │                 Current Folder Settings                 │
        // ╰─────────────────────────────────────────────────────────╯

        containerEl.createEl('h6', { text: 'Current Folder Recommendations' });

        new Setting(containerEl)
            .setName('Current folder first')
            .setDesc(
                'When creating a new note, and you have not written anything into the text box, the first folder recommendation will be your current folder.',
            )
            .addToggle((slider) => {
                slider
                    .setValue(this.plugin.settings.currentFolderFirst)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.currentFolderFirst = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Current folder recommendation')
            .setDesc(
                'When turned on, a Recommendation named "Current Folder" will be available on the folder selection, you can change the name of the recommendation on the next setting.',
            )
            .addToggle((slider) => {
                slider
                    .setValue(this.plugin.settings.currentFolderRecommendation)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.currentFolderRecommendation =
                            value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Current folder recommendation name')
            .setDesc(
                'The name of the "Current Folder" recomendation on the folder selection.',
            )
            .addText((text) => {
                text.setPlaceholder('Current Folder')
                    .setValue(
                        this.plugin.settings.currentFolderRecommendationName,
                    )
                    .onChange(async (value) => {
                        let trimmedValue = value.trim();
                        if (trimmedValue == '') {
                            this.plugin.settings.currentFolderRecommendationName =
                                DEFAULT_SETTINGS.currentFolderRecommendationName!;
                            await this.plugin.saveSettings();
                            return;
                        }
                        this.plugin.settings.currentFolderRecommendationName =
                            trimmedValue;
                        await this.plugin.saveSettings();
                    });
            });

        // ╭─────────────────────────────────────────────────────────╮
        // │                     Untitled Notes                      │
        // ╰─────────────────────────────────────────────────────────╯

        containerEl.createEl('h6', { text: 'Untitled Notes' });

        new Setting(containerEl)
            .setName('Allow untitled notes')
            .setDesc(
                "When you create a note without giving it a title, the program will use the default title specified in the 'Name for untitled notes' setting. However, if this setting is turned off, the program will ask you to enter a title for the note.",
            )
            .addToggle((slider) => {
                slider
                    .setValue(this.plugin.settings.allowUntitledNotes)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.allowUntitledNotes = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Name for untitled notes')
            .setDesc('Default name for untitled notes')
            .addText((text) => {
                text.setPlaceholder('Untitled')
                    .setValue(this.plugin.settings.untitledNoteName)
                    .onChange(async (value) => {
                        const trimmedValue = value.trim();

                        // if (trimmedValue.match(/(<|>|:|"|\\|\||\?|\/|\*)/) !== null) {
                        //     new Notice('The note title must not include any of this characters: < > : " \ ? | *');
                        //     return;
                        // }

                        this.plugin.settings.untitledNoteName = trimmedValue;
                        await this.plugin.saveSettings();
                    });
            });

        // ╭─────────────────────────────────────────────────────────╮
        // │                     Note Templates                      │
        // ╰─────────────────────────────────────────────────────────╯

        containerEl.createEl('h6', { text: 'Note Templates' });

        new Setting(containerEl)
            .setName('Use note templates')
            .setDesc(
                'Whether to use templates that define the contents of the new note.',
            )
            .addToggle((slider) => {
                slider
                    .setValue(this.plugin.settings.usingNoteTemplates)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.usingNoteTemplates = value;
                        await this.plugin.saveSettings();
                    });
            });

        // ── Template Folder Location ────────────────────────────────────────

        const folderLocationSetting = new Setting(containerEl)
            .setName('Template folder location')
            .setDesc('Files in this folder will be available as templates.');

        folderLocationSetting.settingEl.classList.add('FZ-FolderSetting');

        const suggestionDiv = folderLocationSetting.settingEl
            .querySelector('.setting-item-control')!
            .createEl('div', { cls: 'suggestion' });
        const folderInput = suggestionDiv.createEl('input', {
            attr: { id: 'textbox-folder', type: 'text' },
        });
        const templateFolderPath = this.plugin.settings.noteTemplatesFolder;
        const verticalTabContent = document.getElementsByClassName(
            'vertical-tab-content-container',
        )[0];
        const fuzzyListenerAttr = verticalTabContent.getAttr(
            'fuzzy-creator-listener',
        );

        folderInput.placeholder = 'Template Folder';

        if (templateFolderPath === undefined || templateFolderPath === '') {
            folderInput.value = '';
        } else {
            folderInput.value = templateFolderPath;
        }

        if (fuzzyListenerAttr == null) {
            verticalTabContent.addEventListener('click', clickHandler);
            verticalTabContent.setAttr('fuzzy-creator-listener', 'true');
        }

        folderInput.addEventListener('input', () =>
            createSuggestions(folderInput, this.plugin, this.app),
        );
        folderInput.addEventListener('focus', () =>
            createSuggestions(folderInput, this.plugin, this.app),
        );

        // ── Functions & Callbacks ───────────────────────────────────────────

        function closeAllDropdowns() {
            const dropdownMenu = document.getElementById(
                'textbox-folder-dropdown-menu',
            );
            if (dropdownMenu == null) {
                return;
            }
            dropdownMenu.detach();
        }

        function createSuggestions(
            folderInput: HTMLInputElement,
            plugin: FuzzyNoteCreatorPlugin,
            app: App,
        ) {
            let dirs: string[] = [];

            const obsidianFolders = app.vault.getAllFolders();
            for (let i = 0; i < obsidianFolders.length; i++) {
                dirs.push(obsidianFolders[i].path);
            }

            closeAllDropdowns();

            const value = folderInput.value;
            const newDiv = createEl('div', {
                cls: 'dropdown-menu',
                attr: { id: `${folderInput.id}-dropdown-menu` },
            });
            if (folderInput.parentNode !== null) {
                folderInput.parentNode.appendChild(newDiv);
            }

            const lengthOfSuggestions = dirs.length < 5 ? dirs.length : 5;

            for (let i = 0; i < dirs.length; i++) {
                if (dirs[i].toLowerCase().contains(value.toLowerCase())) {
                    const listElement = createEl('div', {
                        text: `${dirs[i]}`,
                        cls: 'dropdown-item',
                    });
                    listElement.addEventListener('click', function () {
                        if (listElement.textContent !== null) {
                            folderInput.value = listElement.textContent;

                            plugin.settings.noteTemplatesFolder =
                                folderInput.value;
                            plugin.saveSettings();
                        }
                        closeAllDropdowns();
                    });
                    newDiv.appendChild(listElement);
                    if (newDiv.childNodes.length === lengthOfSuggestions) {
                        break;
                    }
                }
            }
            if (newDiv.childNodes.length === 0) {
                newDiv.hide();
            }
        }

        function clickHandler(event: UIEvent) {
            const dropdown = document.getElementById(
                'textbox-folder-dropdown-menu',
            );
            const textbox = document.getElementById('textbox-folder');
            let clickedOnChild: boolean = false;

            if (dropdown === null) {
                return;
            }

            for (let i = 0; i < dropdown.childNodes.length; i++) {
                if (dropdown.childNodes[i] === event.target) {
                    clickedOnChild = true;
                }
            }

            if (!clickedOnChild && event.target !== textbox) {
                closeAllDropdowns();
            }
        }

        const userDate =
            (
                this.plugin.settings.dateFormat !== undefined &&
                this.plugin.settings.dateFormat !== ''
            ) ?
                moment().format(this.plugin.settings.dateFormat)
            :   moment().format('YYYY-MM-DD');
        const descriptionDivDate = createEl('div', {
            text: `Inside your template you can put '{{date}}' which when the note is created its gonna be replaced with the value that you define on this setting. With your current settings {{date}} will be replaced with `,
        });
        descriptionDivDate.createEl('b', {
            text: userDate,
            cls: 'u-pop',
            attr: { id: 'userDate' },
        });
        descriptionDivDate.createEl('span', { text: '.' });
        descriptionDivDate.createEl('br');
        descriptionDivDate.createEl('br');
        descriptionDivDate.createEl('span', {
            text: 'You can also use {{date:YYYY-MM-DD}} to override the format.',
        });

        const descriptionDate = new DocumentFragment();
        descriptionDate.append(descriptionDivDate);

        const dateFormatSetting = new Setting(containerEl);
        dateFormatSetting
            .setName('Date format')
            .setDesc(descriptionDate)
            .addMomentFormat((momentComponent) => {
                momentComponent
                    .setValue(this.plugin.settings.dateFormat)
                    .setDefaultFormat('YYYY-MM-DD')
                    .onChange(async (value) => {
                        const trimmedValue = value.trim();
                        this.plugin.settings.dateFormat = trimmedValue;
                        await this.plugin.saveSettings();

                        const userDate =
                            trimmedValue !== '' ?
                                moment().format(trimmedValue)
                            :   moment().format('YYYY-MM-DD');
                        document.getElementById('userDate')!.setText(userDate);
                    });
            });

        const userTime =
            (
                this.plugin.settings.timeFormat !== undefined &&
                this.plugin.settings.timeFormat !== ''
            ) ?
                moment().format(this.plugin.settings.timeFormat)
            :   moment().format('HH:mm');
        const descriptionDivTime = createEl('div', {
            text: `Inside your template you can put '{{time}}' which when the note is created its gonna be replaced with the value that you define on this setting. With your current settings {{time}} will be replaced with `,
        });
        descriptionDivTime.createEl('b', {
            text: userTime,
            cls: 'u-pop',
            attr: { id: 'userTime' },
        });
        descriptionDivTime.createEl('span', { text: '.' });
        descriptionDivTime.createEl('br');
        descriptionDivTime.createEl('br');
        descriptionDivTime.createEl('span', {
            text: 'You can also use {{time:YYYY-MM-DD}} to override the format.',
        });

        const descriptionTime = new DocumentFragment();
        descriptionTime.append(descriptionDivTime);

        const timeFormatSetting = new Setting(containerEl);
        timeFormatSetting
            .setName('Time format')
            .setDesc(descriptionTime)
            .addMomentFormat((momentComponent) => {
                momentComponent
                    .setValue(this.plugin.settings.timeFormat)
                    .setDefaultFormat('HH:mm')
                    .onChange(async (value) => {
                        const trimmedValue = value.trim();
                        this.plugin.settings.timeFormat = trimmedValue;
                        await this.plugin.saveSettings();

                        const userTime =
                            trimmedValue !== '' ?
                                moment().format(trimmedValue)
                            :   moment().format('HH:mm');
                        document.getElementById('userTime')!.setText(userTime);
                    });
            });

        // ╭─────────────────────────────────────────────────────────╮
        // │                  Note Title Templates                   │
        // ╰─────────────────────────────────────────────────────────╯

        containerEl.createEl('h6', { text: 'Note Title Templates' });

        new Setting(containerEl)
            .setName('Use note title templates')
            .setDesc(
                'Whether to use templates that replace dates and are displayed to you when giving your note a title.',
            )
            .addToggle((slider) => {
                slider
                    .setValue(this.plugin.settings.usingTitleTemplates)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.usingTitleTemplates = value;
                        await this.plugin.saveSettings();
                    });
            });

        const exampleDate = moment().format('YYYY-MM-DD');

        const templatesFragment = new DocumentFragment();
        const templatesDescription = containerEl.createEl('div', {
            text: 'If you have note title templates turned on, you will see them when you are inputing your note title. For example, when you create a note with the template: ',
        });
        templatesDescription.createEl('b', {
            text: 'YYYY-MM-DD',
            cls: 'u-pop',
        });
        templatesDescription.createEl('span', {
            text: ' it will be replaced for ',
        });
        templatesDescription.createEl('b', {
            text: `${exampleDate}`,
            cls: 'u-pop',
        });
        templatesDescription.createEl('span', {
            text: ', this according to the formatting that you can see ',
        });
        templatesDescription.createEl('a', {
            text: 'here',
            href: 'https://momentjs.com/docs/#/displaying/format/',
        });
        templatesDescription.createEl('span', { text: '.' });

        templatesFragment.append(templatesDescription);

        new Setting(containerEl)
            .setName('Note title templates')
            .setDesc(templatesFragment)
            .addTextArea((text) => {
                text.setPlaceholder('YYYY-MM-DD')
                    .setValue(this.plugin.settings.titleTemplates)
                    .onChange(async (value) => {
                        const trimmedValue = value.trim();

                        this.plugin.settings.titleTemplates = trimmedValue;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.setCssStyles({ resize: 'none' });
            });

        // ╭─────────────────────────────────────────────────────────╮
        // │                Override New Note Button                 │
        // ╰─────────────────────────────────────────────────────────╯

        containerEl.createEl('h6', { text: 'Override New Note Button' });

        new Setting(containerEl)
            .setName(`Override Obsidian's new note button`)
            .setDesc(
                `When this option is turned on, the 'New Note' button located on top of the file explorer will function as a shortcut to the command that is defined on the 'Override command'.`,
            )
            .addToggle((slider) => {
                slider
                    .setValue(this.plugin.settings.overrideNewNote)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.overrideNewNote = value;
                        await this.plugin.saveSettings();

                        if (value === true) {
                            OverrideNewNote.bind(this.plugin)();
                        } else {
                            RestoreNewNote.bind(this.plugin)();
                        }
                    });
            });

        new Setting(containerEl)
            .setName(`Override command`)
            .setDesc(
                `The command that will be called when you click Obsidian's 'New note' button.`,
            )
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions({
                        'new-tab': 'New Tab',
                        'current-tab': 'Current Tab',
                        'new-window': 'New Window',
                        'split-horizontal':
                            'Current Window: spliting horizontally',
                        'split-vertical': 'Current Window: spliting vertically',
                        'bulk-new-tab': 'Bulk note creation: New Tab',
                        'bulk-current-tab': 'Bulk note creation: Current Tab',
                        'bulk-new-window': 'Bulk note creation: New Window',
                        'bulk-split-horizontal':
                            'Bulk note creation: horizontal splits',
                        'bulk-split-vertical':
                            'Bulk note creation: vertical splits',
                    })
                    .setValue(this.plugin.settings.overrideCommand)
                    .onChange(async (value: string) => {
                        this.plugin.settings.overrideCommand = value;
                        await this.plugin.saveSettings();
                    });
            });
    }
}
