# dsh-plugin-anydoc

一个 DeepSeek Harness (DSH) 插件，将 `@firecrawl/anydoc` 作为 `anydoc` 工具注册给 Agent，把多种文档格式转换为 GitHub-Flavored Markdown。

基于 [@firecrawl/anydoc](https://github.com/firecrawl/anydoc)（Rust 原生绑定，napi-rs），在 libuv 线程池中执行，不阻塞事件循环，无需任何外部进程或 Python 环境。

## 支持的格式

| 类别 | 扩展名 |
| --- | --- |
| Word | `.doc` `.docx` `.docm` |
| PowerPoint | `.ppt` `.pps` `.pot` `.pptx` `.pptm` `.ppsx` `.ppsm` |
| Excel | `.xls` `.xlsx` `.xlsm` `.xlsb` |
| OpenDocument | `.odt` `.ods` `.odp` |
| Rich Text | `.rtf` |
| EPUB | `.epub` |
| CSV | `.csv` |
| PDF | `.pdf` |

> 不支持 HTML、JSON、XML、图片与音频。

## 安装

```sh
dsh plugin --profile web add github:beancookie/dsh-plugin-anydoc
```

安装完成后直接启动：

```sh
dsh web
```

### 卸载

```sh
dsh plugin --profile web remove dsh-plugin-anydoc
```

## 使用

启动 DSH Web 后，向 Agent 发送类似指令：

```
请将 /path/to/report.docx 转换为 Markdown
```

Agent 会调用 `anydoc` 工具，返回转换后的 Markdown 内容。

## 工具参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `filePath` | string | 是 | 要转换文件的绝对或相对路径 |
| `format` | string | 否 | 显式指定格式（如 `csv`）；缺省时根据文件内容自动检测 |
| `outputFilePath` | string | 否 | 将结果写入该文件并返回摘要，而非返回完整 Markdown |

## 开发

```sh
# 安装依赖
pnpm install

# 编译 TypeScript 到 lib/
pnpm build
```

本地加载（--patch 开发模式）：

```sh
pnpm dsh web --patch "/path/to/dsh-plugin-anydoc/dev.cordis.patch.yml"
```

## 社区

本项目积极支持并感谢 [LINUX DO](https://linux.do) 社区——一个面向技术爱好者的友好交流空间。

## 许可

MIT

