[English](https://github.com/BryceWG/siyuan-web-fetch/blob/main/README.md)

# 思源网页抓取

通过 Firecrawl 或 Jina Reader 抓取网页，并将返回的 Markdown 转为思源笔记。

## 功能

- 使用 Firecrawl 或 Jina Reader 抓取指定网址并转换为 Markdown
- 选择笔记本创建新文档
- 使用网页标题作为文档标题
- 在文档开头写入来源链接
- 可通过命令面板或右上角图标打开操作面板

## 前置条件

- 思源 3.5.0+
- Firecrawl API Key（使用官方 Firecrawl 接口时必填；自部署/自定义 Firecrawl 可选）

## 使用方法

1. 在插件设置中填写：
   - Firecrawl Endpoint（可选，用于自部署/自定义 Firecrawl；只需填写服务地址，无需包含 `/v2/scrape`）
   - Firecrawl API Key（使用官方接口时必填；自定义 Endpoint 时可选）
   - 默认服务
   - 默认笔记本（可选）
2. 打开操作面板：
   - 命令面板：`网页抓取：导入为笔记`
   - 或点击右上角插件图标
3. 输入网址，选择服务与笔记本，点击抓取

## 开发调试

```bash
pnpm i
pnpm run dev
```

将插件目录放到 `{工作空间}/data/plugins/` 下，并在思源集市中启用。

## 打包

```bash
pnpm run build
```

将生成用于发布的 `package.zip`。

## 说明

- 支持 Firecrawl 与 Jina Reader 服务。
- 新建文档首行会写入 `来源: <url>`，后面为抓取到的 Markdown 内容。
