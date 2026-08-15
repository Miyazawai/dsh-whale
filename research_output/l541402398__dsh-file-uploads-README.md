# dsh-file-uploads

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4f46e5)](https://github.com/deepseek-ai/deepseek-harness)

English | [简体中文](README.zh.md)

Upload arbitrary local files from the DeepSeek Harness Web composer, attach their container paths to prompts, and manage stored uploads from Settings.

## Features

- Adds a **Files** button beside the existing composer controls.
- Accepts multiple arbitrary local files, not only images.
- Shows pending files as image-like cards above the composer.
- Keeps the text editor clean: no visible path or generated description is inserted into the draft.
- Serializes each hidden file reference into a model-readable absolute path only when the message is submitted.
- Clears pending cards after submission and restores them when submission fails.
- Stores every upload in one fixed directory, `$DSH_HOME/uploads` by default.
- Lists uploaded files in **Settings → Uploaded files**, with download and delete actions.
- Prevents overwrites by publishing duplicates as `name (1).ext`, `name (2).ext`, and so on.
- Enforces per-file and total-directory quotas.

## Compatibility

- DeepSeek Harness `0.1.0-rc.6`
- Web profile
- Node.js 22 or newer

Harness currently transports native attachments as raster images only. This plugin intentionally uses the arbitrary-file path supported by the agent environment: it stores the file inside the Harness host/container and adds that path to the submitted text through the built-in input-reference serializer.

## Install

Install the tagged GitHub release into the Web profile:

```sh
dsh plugin --profile web add "github:l541402398/dsh-file-uploads#v1.0.0"
```

Restart the running Web profile after installation, then refresh the browser page.

To install the latest development branch instead:

```sh
dsh plugin --profile web add "github:l541402398/dsh-file-uploads#main"
```

To remove it:

```sh
dsh plugin --profile web remove dsh-file-uploads
```

## Use

1. Open a conversation in the Harness Web GUI.
2. Select **Files** in the composer toolbar.
3. Choose one or more local files.
4. Review or remove the pending cards above the composer.
5. Add any normal prompt text you want, or leave the editor empty.
6. Submit the message. The model receives a line such as:

   ```text
   上传文件：`/path/to/.dsh/uploads/report.pdf`
   ```

The generated line is never shown in the editor before submission. The stored path refers to the filesystem visible to the Harness host; in a Docker deployment, this is the path inside the container.

## Settings

The plugin adds an **Uploaded files** section to Settings. It displays:

- the fixed storage directory;
- per-file and total-directory limits;
- current storage usage;
- file name, size, modification time, and absolute path;
- download and delete actions.

Files persist until they are deleted manually.

## Configuration

The plugin works without configuration. These environment variables override its defaults:

| Variable | Default | Purpose |
|---|---:|---|
| `DSH_UPLOAD_DIR` | `$DSH_HOME/uploads` | Absolute upload directory. |
| `DSH_UPLOAD_MAX_BYTES` | `104857600` | Maximum bytes per file (100 MiB). |
| `DSH_UPLOAD_TOTAL_MAX_BYTES` | `1073741824` | Maximum total bytes in the directory (1 GiB). |

Example Docker Compose fragment:

```yaml
services:
  dsh:
    environment:
      DSH_UPLOAD_DIR: /data/dsh/uploads
      DSH_UPLOAD_MAX_BYTES: 104857600
      DSH_UPLOAD_TOTAL_MAX_BYTES: 1073741824
    volumes:
      - ./dsh-data:/data/dsh
```

## Security model

- List, upload, download, and delete routes use the same loopback/trusted-host and Origin checks as the built-in Harness Web API.
- Cross-site browser requests are rejected.
- File names are normalized and stripped of path components and control characters.
- Downloads and deletions accept only regular files in the configured directory and do not follow symbolic links.
- Uploads are written to private temporary files, synced, and atomically published without overwriting existing files.
- Interrupted `.upload-*` temporary files are removed when the plugin starts.
- Unexpected server errors are logged without returning internal paths to the browser.

This trust fence is not a user-account authentication system. If the Harness Web GUI is exposed to other users or the public Internet, protect the whole deployment with an authenticated reverse proxy and configure Harness trusted hosts correctly.

## Development

Run the checks:

```sh
npm test
npm run check
```

The package is a persistent dual-face Cordis bundle:

- `index.js` — Host HTTP routes, storage, quotas, and trust checks.
- `client.js` — composer button, pending-file rail, hidden reference codec, and Settings UI.
- `cordis.patch.yml` — installable `dsh.bundle` composition row.
- `test/upload-manager.test.js` — Host storage and security regression tests.

See [CONTRIBUTING.md](CONTRIBUTING.md) for local-link development instructions.

## License

[MIT](LICENSE)

