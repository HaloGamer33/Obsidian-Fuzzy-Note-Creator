import { TFile } from 'obsidian';

export function OpenNote(newNote: TFile) {
    switch (this.leafMode) {
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
