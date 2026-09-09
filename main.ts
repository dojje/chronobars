import { Plugin } from 'obsidian';

const DEFAULT_REMAINING_FORMAT = 'd h m s';

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

		const times = this.getTimes(params.start, params.end);
		if (!times) {
			wrapper.createEl('div', { text: 'Invalid time format (use YYYY-MM-DD HH:MM or HH:MM)' });
			container.replaceWith(wrapper);
			return;
		}

		const progress = this.calculateProgress(times.startTime, times.endTime);

		if (params.name) {
			const text = wrapper.createDiv({ cls: 'chrono-bar-text' });
			text.setText(`${params.name}`);
		}

		// Build the chrono bar components
		const bar = wrapper.createDiv({ cls: 'chrono-bar' });
		const fill = bar.createDiv({cls: 'chrono-bar-fill' });
		fill.setCssProps({ '--progress': `${progress * 100}%` });

		const remainingFormat = this.getRemainingFormat(params);
		const remainingPosition = (params.remainingPosition || 'below').trim().toLowerCase();
		const showPercentage = params.percentage != 'false' && remainingPosition != 'replace';

		if (showPercentage) {
			const text = wrapper.createDiv({ cls: 'chrono-bar-text' });
			text.setText(`${Math.round(progress * 100)}%${params.dates == "true" ? ` (${params.start} -> ${params.end})` : ""}`);
		}

		if (remainingFormat) {
			const text = wrapper.createDiv({ cls: 'chrono-bar-text chrono-bar-remaining' });
			const render = () => {
				const now = new Date();
				const remainingMs = times.endTime.getTime() - now.getTime();
				if (remainingMs <= 0) {
					text.setText('Ended');
					return false;
				}
				const label = params.remainingLabel ? `${params.remainingLabel} ` : '';
				text.setText(`${label}${this.formatDuration(remainingMs, now, new Date(times.endTime.getTime()), remainingFormat)}`);
				return true;
			};
			const alive = render();
			if (alive) {
				const hasSeconds = remainingFormat.indexOf('s') !== -1;
				const intervalMs = hasSeconds ? 1000 : 30000;
				const intervalId = window.setInterval(() => {
					if (!text.isConnected) {
						window.clearInterval(intervalId);
						return;
					}
					const stillAlive = render();
					if (!stillAlive) {
						window.clearInterval(intervalId);
					}
				}, intervalMs);
			}
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

	private parseDateTime(input: string): Date | null {
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

		if ([year, month, day, hour, minute].some(n => isNaN(n))) {
			return null;
		}

		return new Date(year, month - 1, day, hour, minute);
	}

	private getTimes(start: string, end: string): { startTime: Date; endTime: Date } | null {
		const startTime = this.parseDateTime(start);
		const endTime = this.parseDateTime(end);
		if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
			return null;
		}

		// Handle wrap-around if end is before start (over midnight)
		if (endTime <= startTime) {
			endTime.setDate(endTime.getDate() + 1);
		}

		return { startTime, endTime };
	}

	private calculateProgress(startTime: Date, endTime: Date): number {
		const now = new Date();
		const total = endTime.getTime() - startTime.getTime();
		const elapsed = now.getTime() - startTime.getTime();

		if (total <= 0) return 0;
		return Math.min(1, Math.max(0, elapsed / total));
	}

	private getRemainingFormat(params: { [key: string]: string }): string | null {
		// Explicit format string enables the remaining line, as requested in issue 1.
		if (params.remainingTimeFormat && params.remainingTimeFormat.trim() !== '') {
			const fmt = params.remainingTimeFormat.trim();
			if (this.isValidFormat(fmt)) {
				return fmt;
			}
			return DEFAULT_REMAINING_FORMAT;
		}
		// Shorthand: remaining: true uses the default format.
		if (params.remaining && params.remaining.toLowerCase() === 'true') {
			return DEFAULT_REMAINING_FORMAT;
		}
		return null;
	}

	private isValidFormat(fmt: string): boolean {
		return /[yMdhms]/.test(fmt);
	}

	private formatDuration(remainingMs: number, now: Date, end: Date, fmt: string): string {
		const showY = fmt.indexOf('y') !== -1;
		const showMo = fmt.indexOf('M') !== -1;
		const showD = fmt.indexOf('d') !== -1;
		const showH = fmt.indexOf('h') !== -1;
		const showMin = fmt.indexOf('m') !== -1;
		const showS = fmt.indexOf('s') !== -1;

		let years = 0;
		let months = 0;
		let base = new Date(now.getTime());

		if (showY || showMo) {
			const full = this.calendarYearMonthDiff(now, end);
			if (showY && showMo) {
				years = full.years;
				months = full.months;
				base = this.addMonths(now, full.years * 12 + full.months);
			} else if (showY) {
				years = full.years;
				base = this.addMonths(now, full.years * 12);
			} else {
				const totalMonths = full.years * 12 + full.months;
				months = totalMonths;
				base = this.addMonths(now, totalMonths);
			}
		}

		let rest = end.getTime() - base.getTime();
		if (rest < 0) rest = 0;
		const dayMs = 24 * 60 * 60 * 1000;
		const hourMs = 60 * 60 * 1000;
		const minMs = 60 * 1000;

		let days = Math.floor(rest / dayMs);
		rest -= days * dayMs;
		let hours = Math.floor(rest / hourMs);
		rest -= hours * hourMs;
		let mins = Math.floor(rest / minMs);
		rest -= mins * minMs;
		let secs = Math.floor(rest / 1000);

		// Roll omitted units down into the next smaller shown unit.
		if (!showD) {
			hours += days * 24;
			days = 0;
		}
		if (!showH) {
			mins += hours * 60;
			hours = 0;
		}
		if (!showMin) {
			secs += mins * 60;
			mins = 0;
		}

		const parts: { v: number; s: string }[] = [];
		if (showY) parts.push({ v: years, s: 'y' });
		if (showMo) parts.push({ v: months, s: 'M' });
		if (showD) parts.push({ v: days, s: 'd' });
		if (showH) parts.push({ v: hours, s: 'h' });
		if (showMin) parts.push({ v: mins, s: 'm' });
		if (showS) parts.push({ v: secs, s: 's' });

		// Drop leading zeros, but always keep the smallest requested unit.
		let firstNonZero = parts.findIndex(p => p.v > 0);
		if (firstNonZero === -1) {
			const last = parts[parts.length - 1];
			return `0${last.s}`;
		}
		return parts.slice(firstNonZero).map(p => `${p.v}${p.s}`).join(' ');
	}

	private calendarYearMonthDiff(from: Date, to: Date): { years: number; months: number } {
		let years = to.getFullYear() - from.getFullYear();
		let probe = new Date(from.getTime());
		probe.setFullYear(probe.getFullYear() + years);
		if (probe.getTime() > to.getTime()) {
			years -= 1;
			probe = new Date(from.getTime());
			probe.setFullYear(probe.getFullYear() + years);
		}
		let months = (to.getFullYear() - probe.getFullYear()) * 12 + (to.getMonth() - probe.getMonth());
		const probe2 = new Date(probe.getTime());
		probe2.setMonth(probe2.getMonth() + months);
		if (probe2.getTime() > to.getTime()) {
			months -= 1;
		}
		if (months < 0) months = 0;
		if (years < 0) years = 0;
		return { years, months };
	}

	private addMonths(date: Date, count: number): Date {
		const d = new Date(date.getTime());
		d.setMonth(d.getMonth() + count);
		return d;
	}
}
