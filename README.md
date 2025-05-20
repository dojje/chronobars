# Chronobars

Time Progress bars for Obsidian

![ChronoBars Example](https://imgur.com/aE24YyR.png)

## Features

- 🕒 **Flexible time formats** - Supports both simple time (HH:MM) and full datetime (YYYY-MM-DD HH:MM)
- 🌙 **Overnight support** - Correctly handles ranges crossing midnight
- 🎨 **Customizable display** - Show/hide percentage, dates, and add custom names

## Installation

1. Available soon via the Obsidian Community Plugins tab
2. Or install manually:
   - Download the latest release
   - Extract to your vault's plugins folder: `.obsidian/plugins/chrono-bars`

## Usage

Create a code block with the `chrono-bar` settings:

````markdown
```chrono-bar
start: 09:00
end: 17:00
name: Workday
percentage: true
dates: true
```
````

### Supported Parameters

| Parameter    | Description                          | Default       | Examples               |
|--------------|--------------------------------------|---------------|------------------------|
| `start`      | Start time (required)                | -             | `09:00`, `2023-12-31 23:30` |
| `end`        | End time (required)                  | -             | `17:00`, `2024-01-01 02:00` |
| `name`       | Custom title for the bar             | None          | `name: Workday`        |
| `percentage` | Show/hide percentage                 | `true`        | `percentage: false`    |
| `dates`      | Show/hide date/time labels           | `false`       | `dates: true`          |

### Time Format Examples

- Simple time: `14:30`
- Full datetime: `2023-12-31 23:30`
- Overnight range: `23:30` to `03:00` (automatically handles midnight crossing)

## Examples

````markdown
```chrono-bar
start: 2025-01-01 00:00
end: 2026-01-01 00:00
name: New Year Countdown
dates: true
```
````

Becomes
![New Year Example](https://imgur.com/MbKACK2.png)


## Styling

You can customize the appearance by adding these CSS snippets to your vault:
```
.chrono-bar-container {
  /\* Container styles */
}

.chrono-bar {
  /\* Background bar styles */
  height: 20px;
}

.chrono-bar-fill {
  /\* Progress fill styles */
  background-color: var(--interactive-accent);
}

.chrono-bar-text {
  /\* Text styles */
}
```

## Development

Want to contribute? Here's how to set up the development environment:

1. Clone this repository

2. `npm install`

3. `npm run dev` to start compilation in watch mode

Support
Found a bug or have a feature request? [Please open an issue](https://github.com/dojje/chronobars/issues).

