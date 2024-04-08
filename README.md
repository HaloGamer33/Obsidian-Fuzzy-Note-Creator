# Obsidian Fuzzy Note Creator

This Obsidian plugin allows users to quickly create new notes using a fuzzy search interface for selecting the destination folder and providing the note title.

# Usage

## Opening Fuzzy Note Creator

1. Press Ctrl + P (Cmd + P on macOS) to open the command palette.
2. Type 'Fuzzy Note Creator' and select one of the following commands:

- Note in new tab
- Note in current tab
- Note in new window
- Note in current window spliting horizontaly
- Note in current window spliting verticaly

The names explain what they do, but I would recommend trying them out to see which functionality you like the most. You may also 
set a keybind to open the note creator (settings -> hotkeys).

## Bulk note creation

Each one of the commands has a 'bulk' version, this means that after selecting the desired folder the creation dialogue 
wont close after the new note has been created, this allows you to create multiple files in the same folder without having to call the 
command multiple times.

## Creating a New Note

1. Upon opening the Fuzzy Note Creator, you will be prompted to enter the path to the folder where you want to create the note.
2. Type the path into the input field. You will receive suggestions based on existing folders in your vault. Use tab to autocomplete.
3. Select the desired folder from the suggestions.
4. After selecting the folder, you will be prompted to enter the title of the new note.
5. Enter the title and press Enter.
6. The note will be opened in the Obsidian workspace based on the command that you selected.

## Use of `/` and `\` when inputing the note title

If you use either `/` or `\` in the title note, the plugin assumes that you want to create the parent folders for you note, for example:

Let's say that you selected `Parent Folder` as the folder where you want to create the note, and then you input `This is a folder/This is a note`
as the title of the note, the plugin will then create the folder `This is a folder` inside of `Parent Folder` which would result in a path that
looks like this `Parent Folder/This is a folder` afterwards the plugin will create your note with the title `This is a note` inside of `This is a folder`, so the final note will
be located at: `Parent Folder/This is a folder/This is a note.md`.

You can use either `/` or `\` to trigger this functionality, you can even combine the two.

`/\this//is/\/a /test to // demostrate functionality \ hope you\ \ \like it \/` is a valid input that would result in: `this/is/a/test to/demostrate functionality/hope you/like it.md`

## Settings

As of version 0.2.0 there are 4 settings that you can configure:

### 1. **Show instructions**

This toggles the visibility of the built-in instructions that you see when opening the plugin:

Setting turned on
<p align="center">
    <img src="https://i.imgur.com/hy0FAij.png" alt="Image of the setting turned on" width=75%>
</p>

Setting turned off
<p align="center">
    <img src="https://i.imgur.com/YuEjGzH.png" alt="Image of the setting turned off" width=75%>
</p>

### 2. **Allow untitled notes**

If you have this setting turned on then when you provide no title name the plugin will create a new note based on the title that you give on the `Name for untitled notes` setting,
if you have it turned off, then a notice will appear on the top right of the screen asking you to set a title for your note.

### 3. **File extension**

When creating any note with the plugin, the file extension that you define on this setting will be appended to the end of the note title that you provide. If you set anything other
than `.md` (Markdown) then obsidian will try to open the file in system's the default application after it has been created. If left empty it will default to `.md`.

### 4. **Name for untitles notes**

This is the name that the plugin will use when you provide no title for your new note and the setting `Allow untitled notes` is turned on. If left empty it will default to
`Untitled`.

# Contributing

If you encounter any issues or have suggestions for improvements, please feel free to open an issue on the GitHub repository.

# License

This plugin is licensed under the GNU GPLv3 License.
