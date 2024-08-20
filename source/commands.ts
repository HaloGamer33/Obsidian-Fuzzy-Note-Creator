import { FolderSelectionModal } from './folder-selection-modal';

export function AddCommands() {
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
        name: 'Note in current window spliting horizontally',
        callback: () => {
            new FolderSelectionModal(this.app, 'split-horizontal', this.settings).open();
        },
    });

    this.addCommand({
        id: 'split-vertical',
        name: 'Note in current window spliting vertically',
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
