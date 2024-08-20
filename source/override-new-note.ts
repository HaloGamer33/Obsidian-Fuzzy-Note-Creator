import { FolderSelectionModal } from './folder-selection-modal';

let originalButton: Element;

// Function extracted from: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
// Credit to https://stackoverflow.com/users/492336/sashoalma - https://stackoverflow.com/users/4556536/yong-wang
// (not sure how stackoverflow works and it shows two names on the answer so... i put both in here)
function waitForElement(selector: string) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(_ => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

export async function OverrideNewNote() {
    await waitForElement('[aria-label="New note"]')

    const newNoteButton = document.querySelector('[aria-label="New note"]');
    if (newNoteButton) {
        originalButton = newNoteButton;
    }

    if (newNoteButton) {
        const modifiedButton = newNoteButton.cloneNode(true);
        newNoteButton.parentNode!.replaceChild(modifiedButton, newNoteButton);
        modifiedButton.addEventListener('click', () => {
            new FolderSelectionModal(this.app, this.settings.overrideCommand, this.settings).open();
        });
    }
}

export async function RestoreNewNote() {
    if (originalButton === undefined) {
        return;
    }

    await waitForElement('[aria-label="New note"]')

    const modifiedButton = document.querySelector('[aria-label="New note"]');

    if (modifiedButton) {
        modifiedButton.parentNode!.replaceChild(originalButton, modifiedButton);
    }
}
