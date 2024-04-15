import FuzzyNoteCreatorPlugin from './main';
import { App, PluginSettingTab, Setting, Platform, sanitizeHTMLToDom } from 'obsidian';

export interface FuzzyNoteCreatorSettings {
    showInstructions: boolean;
    windowsNoteTitleCompatibility: boolean,
    allowUntitledNotes: boolean;
    defaultNoteExtension: string;
    untitledNoteName: string;
    useNoteTitleTemplates: boolean;
    noteTitleTemplates: string;
}

export const DEFAULT_SETTINGS: Partial<FuzzyNoteCreatorSettings> = {
    showInstructions: true,
    windowsNoteTitleCompatibility: false,
    allowUntitledNotes: true,
    defaultNoteExtension: '.md',
    untitledNoteName: 'Untitled',
    useNoteTitleTemplates: false,
};

export class FuzzyNoteCreatorSettingTab extends PluginSettingTab {
    plugin: FuzzyNoteCreatorPlugin

    constructor(app: App, plugin: FuzzyNoteCreatorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
        .setName('Show instructions')
        .setDesc('Whether to show the instructions on how to use the plugin when using it')
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
            .setDesc('When turned on, the plugin won\'t allow you to title notes with Window\'s illegal characters even if you are not on Windows. If running on windows this setting has no effect.')
                .addToggle((slider) => {
                    slider
                    .setValue(this.plugin.settings.windowsNoteTitleCompatibility)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.windowsNoteTitleCompatibility = value;
                        await this.plugin.saveSettings();
                    });
                });
        }

        new Setting(containerEl)
        .setName('File extension')
        .setDesc('Default file extension of the notes')
        .addText((text) => {
            text
            .setPlaceholder('.md')
            .setValue(this.plugin.settings.defaultNoteExtension)
            .onChange(async (value) => {
                this.plugin.settings.defaultNoteExtension = value.trim();
                await this.plugin.saveSettings();
            })
        });

        containerEl.createEl('h6', { text: 'Untitled Notes'});

        new Setting(containerEl)
        .setName('Allow untitled notes')
        .setDesc('When you create a note without giving it a title, the program will use the default title specified in the \'Name for untitled notes\' setting. However, if this setting is turned off, the program will ask you to enter a title for the note.')
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
            text
            .setPlaceholder('Untitled')
            .setValue(this.plugin.settings.untitledNoteName)
            .onChange(async (value) => {
                const trimmedValue = value.trim();

                // if (trimmedValue.match(/(<|>|:|"|\\|\||\?|\/|\*)/) !== null) {
                //     new Notice('The note title must not include any of this characters: < > : " \ ? | *');
                //     return;
                // }

                this.plugin.settings.untitledNoteName = trimmedValue;
                await this.plugin.saveSettings();
            })
        });

        containerEl.createEl('h6', {text: 'Note title templates'});

        new Setting(containerEl)
        .setName('Use note title templates')
        .setDesc('Whether to use templates that replace dates and are displayed to you when giving your note a title.')
        .addToggle((slider) => {
            slider
            .setValue(this.plugin.settings.useNoteTitleTemplates)
            .onChange(async (value: boolean) => {
                this.plugin.settings.useNoteTitleTemplates = value;
                await this.plugin.saveSettings();
            });
        });

        const templatesFragment = new DocumentFragment();
        const templatesDescription = containerEl.createEl('div', {text: 'If you have note title templates turned on, you will see them when you are inputing your note title, dates displayed like so: YYYY-MM-DD will be replaced for the date.'});
        const templatesLink = containerEl.createEl('a', {text: 'Reference for formatting', href: 'https://momentjs.com/docs/#/displaying/format/'});

        templatesFragment.append(templatesDescription);
        templatesFragment.append(templatesLink);

        new Setting(containerEl)
        .setName('Note title templates')
        .setDesc(templatesFragment)
        .addTextArea((text) => {
            text
            .setPlaceholder('YYYY-MM-DD')
            .setValue(this.plugin.settings.noteTitleTemplates)
            .onChange(async (value) => {
                const trimmedValue = value.trim();

                this.plugin.settings.noteTitleTemplates = trimmedValue;
                await this.plugin.saveSettings();
            })
        });
    }
}
