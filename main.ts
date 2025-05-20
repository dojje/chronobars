import { Plugin } from 'obsidian';

export default class ChronoBarsPlugin extends Plugin {
    async onload() {
		this.registerMarkdownCodeBlockProcessor("chrono-bar", (source, el, ctx) => {
			this.renderChronoBar(el, source);
		});
    }

	renderChronoBar(container: HTMLElement, source: string) {
		const params = this.parseParameters(source);
		
		// Create wrapper element to replace the code block
		const wrapper = createDiv({ cls: 'chrono-bar-container' });
		
		// Handle errors first
		if (!params.start || !params.end) {
			wrapper.createEl('div', { text: 'Missing start/end times in chrono bar' });
			container.replaceWith(wrapper);
			return;
		}

		const progress = this.calculateProgress(params.start, params.end);
		if (isNaN(progress)) {
			wrapper.createEl('div', { text: 'Invalid time format (use HH:MM)' });
			container.replaceWith(wrapper);
			return;
		}

		// Build the chrono bar components
		const bar = wrapper.createDiv({ cls: 'chrono-bar' });
		const fill = bar.createDiv({ cls: 'chrono-bar-fill' });
		fill.style.width = `${progress * 100}%`;
		
		const text = wrapper.createDiv({ cls: 'chrono-bar-text' });
		text.setText(`${Math.round(progress * 100)}% (${params.start} → ${params.end})`);

		// Replace the original code block with our custom component
		container.replaceWith(wrapper);
	}

    private parseParameters(source: string): { [key: string]: string } {
        return source.split('\n').reduce((acc, line) => {
            const [key, ...values] = line.split(':').map(s => s.trim());
            if (key && values.length) acc[key] = values.join(':').trim();
            return acc;
        }, {} as { [key: string]: string });
    }

    private calculateProgress(start: string, end: string): number {
        const parseTime = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + (m || 0);
        };

        const startMinutes = parseTime(start);
        const endMinutes = parseTime(end);
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (endMinutes <= startMinutes) return 0;
        return Math.min(1, Math.max(0, (currentMinutes - startMinutes) / (endMinutes - startMinutes)));
    }
}