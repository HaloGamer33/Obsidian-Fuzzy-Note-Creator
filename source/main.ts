import { Plugin } from 'obsidian';
import { FuzzyNoteCreatorSettingTab, FuzzyNoteCreatorSettings, DEFAULT_SETTINGS } from './settingsTab';
import { AddCommands } from './commands';

export default class FuzzyNoteCreatorPlugin extends Plugin {
    settings: FuzzyNoteCreatorSettings;

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

        // Arguments: (app, plugin)
        this.addSettingTab(new FuzzyNoteCreatorSettingTab(this.app, this));

        // Bind `this` context and then call the function
        AddCommands.bind(this)();
    }
}