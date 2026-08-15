# vision-toolkit 配置指引（智谱免费多模态）

> 适用：dsh-whale 核心包内的 dsh-vision-toolkit（10 个 `vision_*` 工具：图片问答、OCR、定位、UI 还原、像素比对等）。
> 参考：[free-vision-skill providers.json](https://raw.githubusercontent.com/lora-sys/free-vision-skill/main/registry/providers.json)、[ds-vision-skill channels.md](https://raw.githubusercontent.com/Sorwcyra/ds-vision-skill/refs/heads/main/references/channels.md)

## 一句话

vision-toolkit 是"本地 + 远程"混合的视觉后端：**本地工具不需要任何 key**（Python 环境首次激活自动准备）；只有 4 个远程工具（`vision_glance` / `vision_ground` / `vision_detect` / 长截图 OCR）需要 OpenAI 兼容或 Anthropic 视觉 API。**推荐用智谱（Zhipu BigModel）的永久免费视觉模型接入。**

## 步骤

1. 注册 [智谱开放平台 bigmodel.cn](https://bigmodel.cn) → 控制台创建 **API Key**（免费）。
2. 打开 DSH Web → 设置 → **Vision Toolkit**。
3. 配置（OpenAI 兼容协议）：
   - **Provider / 协议**：OpenAI 兼容
   - **Base URL**：`https://open.bigmodel.cn/api/paas/v4`
   - **模型**：`glm-4.6v-flash`（推荐，免费）或 `glm-4v-flash`（免费）
   - **API Key**：上一步的智谱 Key（存进 DSH Credentials，界面会打码）
4. 点 **连接测试 / 健康检查**，通过即完成。

## 免费备选通道

| 提供商 | Base URL | 模型 | 备注 |
|---|---|---|---|
| 智谱 BigModel（推荐） | `https://open.bigmodel.cn/api/paas/v4` | `glm-4.6v-flash` / `glm-4v-flash` | 永久免费、大陆直连 |
| ModelScope | `https://api-inference.modelscope.cn/v1` | `Qwen/Qwen3-VL-8B-Instruct` | token 需 `ms-` 前缀，不带 Bearer |
| OpenRouter | `https://openrouter.ai/api/v1` | `nvidia/nemotron-nano-12b-v2-vl:free` | 免费变体，共享限额 |
| 阿里云百炼 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen3-vl-flash` | 新用户额度，90 天 |

## 常见问题

- **`vision_html_screenshot` 报错**：该工具需要本机 Chrome/Chromium/Edge（`--headless=new`），与其他工具无关。
- **本地工具不需要 key**：`vision_toolkit_activate` 引导激活后，本地工具（像素比对、主色、前景提取等）直接可用。
- **模型拒绝图片附件**：DSH 原生附件通道只支持位图，走 vision-toolkit 的 Paste Input 落盘路径即可。
