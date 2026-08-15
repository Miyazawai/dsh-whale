# AGENTS.md — dsh-whale（鲸鱼包）

dsh-whale 是一个「傻瓜整合包」发行版：以 oh-dsh（社区发行层，三形态 webui/gui/tui 统一）为基座的**一次性源码级 fork**，独立演进、不合上游。目标用户是 Windows 小白，核心价值是"每功能一实现"的去重选品 + 兼容性补丁 + 预设配置 + 三 UI 开箱即用。

动手前必读：

- `CONTEXT.md` —— 领域术语表（发行版外壳、发行层、基座、核心包/可选包、补丁优先维护、许可政策等）。输出命名用术语表的词，不要漂移。
- `docs/selection.md` —— 终版选品清单（核心 16 / 可选 17 / 不选 / 融合），改动插件集合先改这里。
- `docs/adr/0001-distribution-shell-on-oh-dsh.md` —— 架构决策（基座、fork 模式、锁定基线、宽松许可）。
- `docs/overlap-map.md` —— 调研底稿（15 个功能簇的重叠地图）。
- `docs/agents/` —— 工程技能配置（issue tracker / triage labels / domain docs）。

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues on the `dsh-whale` repo; use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the root, ADRs in `docs/adr/`. See `docs/agents/domain.md`.
