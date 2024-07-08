import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { exec } from 'child_process';

interface PublishPostSettings {
	repositoryPath: string;
	gpgPath: string;
}

export default class PublishPostPlugin extends Plugin {
	settings: PublishPostSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'publish-post-command',
			name: 'Push to Git',
			editorCallback: () => {
				const fname = this.app.workspace.getActiveFile()?.name
				if (fname) {
					const gitCommand = `
						git -C "${this.settings.repositoryPath}" add "${fname}" &&
						git -C "${this.settings.repositoryPath}" -c gpg.program="${this.settings.gpgPath}" commit -S -m "Publish Post from Obsidian" &&
						git -C "${this.settings.repositoryPath}" push
					`;

					exec(gitCommand, (error, stdout, stderr) => {
						if (error) {
							console.log(`exec error: ${error}`);
							return;
						}
						new Notice("Successfully Published Post!")
						console.log(`stdout: ${stdout}`);
					});
				} else {
					new Notice('No file selected');
				}
			}
		});

		this.addSettingTab(new PublishPostSettingsTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, {}, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class PublishPostSettingsTab extends PluginSettingTab {
	plugin: PublishPostPlugin;

	constructor(app: App, plugin: PublishPostPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Repository Path')
			.setDesc('Path to your Git repository where your file lives')
			.addText(text => text
				.setPlaceholder('Enter path to repository')
				.setValue(this.plugin.settings.repositoryPath)
				.onChange(async (value) => {
					this.plugin.settings.repositoryPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('GPG Key')
			.setDesc('If you have verified commits, set your GPG key')
			.addText(text => text
				.setPlaceholder('Enter GPG key')
				.setValue(this.plugin.settings.gpgPath)
				.onChange(async (value) => {
					this.plugin.settings.gpgPath = value;
					await this.plugin.saveSettings();
				}));
	}
}
