[中文](https://github.com/BryceWG/siyuan-web-fetch/blob/main/README_zh_CN.md)

# SiYuan Web Fetch

Fetch web pages with Firecrawl or Jina Reader and create SiYuan notes from the returned Markdown.

## Features

- Fetch a URL and convert it to Markdown via Firecrawl or Jina Reader
- Create a new note in a selected notebook
- Use page title as the note title
- Insert the source URL at the top of the note
- Open the panel from the command palette or the top-right toolbar icon

## Requirements

- SiYuan 3.5.0+
- A Firecrawl API key (only for Firecrawl)

## Usage

1. Open plugin settings and set:
   - Firecrawl API key (optional, for Firecrawl)
   - Default service
   - Default notebook (optional)
2. Open the panel:
   - Command palette: `Web Fetch: Capture URL`
   - Or click the top-right toolbar icon
3. Enter the URL, pick a service and notebook, and click Fetch

## Development

```bash
pnpm i
pnpm run dev
```

Place the plugin folder under `{workspace}/data/plugins/` and enable it in the SiYuan marketplace.

## Build

```bash
pnpm run build
```

This generates `package.zip` for publishing.

## Notes

- Supported services: Firecrawl and Jina Reader.
- The created note starts with a `Source: <url>` line, followed by the Markdown content.
