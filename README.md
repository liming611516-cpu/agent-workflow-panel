# Agent Workflow Panel

一个 **Next.js 14 App Router + React + TypeScript** 的 Agent 工作流可视化面板 / Prompt 调试台。整个应用**无后端依赖**：所有数据来自前端一份写死的 `src/mock/run.json`，适合在面试或作品集里本地 `npm run build` 跑通。

## 快速开始

```powershell
cd agent-workflow-panel
npm install
npm run dev        # http://localhost:3000
# 或者：
npm run build && npm start
```

## 三个 Tab

### 1. Workflow DAG 可视化
- 用原生 SVG 画贝塞尔曲线连接节点，节点是绝对定位的 div，**没有引入任何重型图编辑器库**。
- 流水线：`Planner → Designer → CodeGen → Verify → Fixer`。
- 点击任意节点，右侧面板展示该节点的 inputs / outputs / tool call 历史（含每次工具调用耗时）。
- 节点状态用颜色区分：success（绿）/ failed（红）/ running（黄）。

### 2. Prompt Playground
- 左侧编辑 system prompt 与 user message，实时统计字符数与按"字符数 / 4"估算的 token 数。
- 右侧展示 OpenAI 风格的 `tools` JSON schema，以及一段 mock 的 `tool_calls` 输出——让面试官一眼看到你理解 Function Calling 的报文结构。

### 3. Run Timeline
- 模拟一次 run 的时间线：每一步的耗时（ms）、状态、token 估算（in / out）、备注。
- 行内条形图按当前 run 的最大耗时归一化，便于一眼看出哪一步是瓶颈。

## 为什么这是"前端系统能力"的证明

对应 iDVX Lab「Agent 系统研发实习生」考察点 ⑦：**能独立完成完整系统模块**。这个小项目展示了：

- **Next.js App Router 工程化**：`app/` 目录结构、`layout.tsx` 元数据、客户端组件（`"use client"`）、TS 严格模式。
- **状态管理与组件拆分**：Tab 切换、节点选中态、编辑态即时渲染，全部用 React `useState` / `useMemo` 完成，不引 Redux / Zustand。
- **可视化能力**：手写 SVG 曲线 + 绝对定位节点，证明你能在不依赖重型库的情况下把"图"画出来。
- **对 Agent 协议的理解**：prompt 编辑器旁边直接挂 OpenAI tools schema 和 mock `tool_calls`，说明你知道真实 Agent 请求体长什么样。
- **可交付**：`npm run build` 必须通过，没有 TS 报错、没有运行时依赖外部服务。

## 可复用点

- 把 `src/mock/run.json` 换成真实 Agent 后端的 API 响应，就是一个可用的运行观测面板。
- DAG 部分的"节点 + 贝塞尔连线"模式可以直接复用到任意流水线可视化场景。
- Prompt Playground 的"schema + mock output"对照布局，适合做 LLM 工具集设计的调试台。

## 局限

- 数据是写死的 mock，不连真实后端。
- DAG 没有缩放 / 拖拽 / 自动布局；节点坐标在 JSON 里手写。
- 没有引入 tailwind / 状态库，样式用一份手写 CSS，保持依赖最小。
