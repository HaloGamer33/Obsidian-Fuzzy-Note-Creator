import FuzzyNoteCreatorPlugin from './main';
import { App, PluginSettingTab, Setting, Notice } from 'obsidian';

export interface FuzzyNoteCreatorSettings {
    showInstructions: boolean;
    allowUntitledNotes: boolean;
    defaultNoteExtension: string;
    untitledNoteName: string;
}

export const DEFAULT_SETTINGS: Partial<FuzzyNoteCreatorSettings> = {
    showInstructions: true,
    allowUntitledNotes: true,
    defaultNoteExtension: '.md',
    untitledNoteName: 'Untitled',
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
    }
}
