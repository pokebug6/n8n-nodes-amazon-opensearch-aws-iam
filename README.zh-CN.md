# n8n-nodes-amazon-opensearch-aws-iam

[English](README.md)

这是一个 n8n 社区节点，用于通过 **IAM 角色认证** 查询 [Amazon OpenSearch Service](https://aws.amazon.com/opensearch-service/)，无需配置任何凭证。

该节点专为 n8n 运行在 EC2 实例（或 ECS 任务、Lambda 等）上的场景设计，自动从 AWS 默认凭证提供链获取临时凭证，并使用 AWS Signature V4 对每个请求进行签名。

[n8n](https://n8n.io/) 是一个 [公平代码许可](https://docs.n8n.io/sustainable-use-license/) 的工作流自动化平台。

[安装](#安装) |
[功能](#功能) |
[凭证](#凭证) |
[兼容性](#兼容性) |
[使用方法](#使用方法) |
[相关资源](#相关资源) |
[许可证](#许可证)

## 安装

参考 n8n 社区节点文档中的 [安装指南](https://docs.n8n.io/integrations/community-nodes/installation/)。

## 功能

该节点提供两种操作类型：

### Search（搜索）

简化的搜索模式，用于对 OpenSearch 执行搜索查询。

- **Index** — 从动态下拉菜单中选择索引或别名，留空则搜索所有索引。
- **Query Body** — JSON 格式的搜索查询体（默认为 `match_all`）。

### Advanced（高级）

完全控制 OpenSearch REST API。

- **HTTP Method** — GET、POST、PUT、DELETE 或 HEAD。
- **Path** — 任意 API 路径，例如 `my-index/_search`、`_cat/indices`、`_cluster/health`。
- **Query Body** — JSON 格式的请求体（仅在 POST/PUT 时显示）。

### Options（选项）

两种模式均支持以下可选设置：

| 选项 | 说明 |
|------|------|
| Timeout | 请求超时时间，单位毫秒（默认 30000） |
| Skip SSL Certificate Validation | 跳过 SSL 证书验证（不建议在生产环境使用） |
| Return Full Response | 返回完整响应（状态码、响应头、响应体），而非仅返回响应体 |
| Ignore HTTP Status Errors | 4xx/5xx 状态码时不抛出错误 |
| Disable Follow Redirect | 不自动跟随 HTTP 重定向 |
| Query Parameters | 附加到 URL 的查询参数（JSON 格式） |
| Proxy URL | HTTP 代理地址，格式为 `http://host:port` |

## 凭证

**无需配置任何凭证。** 该节点使用 [AWS 默认凭证提供链](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html#credentialProviderChain) 自动获取 IAM 凭证，支持以下方式：

- EC2 实例 IAM 角色（实例元数据）
- ECS 任务 IAM 角色
- 环境变量（`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`）
- 共享凭证文件（`~/.aws/credentials`）
- SSO / Web Identity Token

请确保计算环境关联的 IAM 角色具有必要的 OpenSearch 权限（如 `es:ESHttpGet`、`es:ESHttpPost`）。

## 兼容性

- 需要 n8n v1.0 或更高版本

## 使用方法

1. 在工作流中添加 **Amazon OpenSearch** 节点。
2. 输入 OpenSearch 域的 **Endpoint**（例如 `https://search-my-domain-xxx.us-east-1.es.amazonaws.com`）。
3. 选择 **Region**，或保持 "Auto-Detect From Endpoint" 自动推断。
4. 选择 **Search** 模式查询索引，或选择 **Advanced** 模式执行任意 API 调用。
5. 运行工作流。

### 示例：搜索索引中的所有文档

- Action Type: **Search**
- Index: `my-index`
- Query Body:
```json
{
  "query": {
    "match_all": {}
  },
  "size": 10
}
```

### 示例：查看集群健康状态（Advanced）

- Action Type: **Advanced**
- HTTP Method: **GET**
- Path: `_cluster/health`

## 相关资源

- [n8n 社区节点文档](https://docs.n8n.io/integrations/#community-nodes)
- [Amazon OpenSearch Service 文档](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/)
- [OpenSearch REST API 参考](https://opensearch.org/docs/latest/api-reference/)

## 许可证

[MIT](LICENSE)
