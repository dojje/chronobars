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
			wrapper.createEl('div', { text: 'Invalid time format (use YYYY-MM-DD HH:MM or HH:MM)' });
			container.replaceWith(wrapper);
			return;
		}

		if (params.name) {
			const text = wrapper.createDiv({ cls: 'chrono-bar-text' });
			text.setText(`${params.name}`);
		}

		// Build the chrono bar components
		const bar = wrapper.createDiv({ cls: 'chrono-bar' });
		const fill = bar.createDiv({cls: 'chrono-bar-fill' });
		fill.setCssProps({ '--progress': `${progress * 100}%` });

		if (params.percentage != 'false') {
			const text = wrapper.createDiv({ cls: 'chrono-bar-text' });
			text.setText(`${Math.round(progress * 100)}%${params.dates == "true" ? ` (${params.start} → ${params.end})` : ""}`);
		}
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
		const parseDateTime = (input: string): Date => {
			const now = new Date();
			const normalized = input.trim().replace(/[./]/g, '-');

			let datePart: string;
			let timePart: string;

			if (normalized.includes(' ')) {
				// Format: YYYY-MM-DD HH:MM
				[datePart, timePart] = normalized.split(' ');
			} else if (normalized.includes(':')) {
				// Format: HH:MM (today's date)
				datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
				timePart = normalized;
			} else {
				// Format: YYYY-MM-DD (default time: 09:00)
				datePart = normalized;
				timePart = '09:00';
			}

			const [year, month, day] = datePart.split('-').map(Number);
			const [hour, minute] = timePart.split(':').map(Number);

			return new Date(year, month - 1, day, hour, minute);
		};

		const startTime = parseDateTime(start);
		const endTime = parseDateTime(end);

		// Handle wrap-around if end is before start (over midnight)
		if (endTime <= startTime) {
			endTime.setDate(endTime.getDate() + 1);
		}

		const now = new Date();
		const total = endTime.getTime() - startTime.getTime();
		const elapsed = now.getTime() - startTime.getTime();

		if (total <= 0) return 0;
		return Math.min(1, Math.max(0, elapsed / total));
	}

}
