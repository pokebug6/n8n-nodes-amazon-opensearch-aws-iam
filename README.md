# n8n-nodes-amazon-opensearch-aws-iam

[中文文档](README.zh-CN.md)

This is an n8n community node that lets you query [Amazon OpenSearch Service](https://aws.amazon.com/opensearch-service/) using **IAM role authentication** — no credentials configuration required.

It is designed for environments where n8n runs on an EC2 instance (or ECS task, Lambda, etc.) with an IAM role that has permissions to access OpenSearch. The node automatically obtains temporary credentials from the AWS default credential provider chain and signs every request with AWS Signature V4.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) |
[Operations](#operations) |
[Credentials](#credentials) |
[Compatibility](#compatibility) |
[Usage](#usage) |
[Resources](#resources) |
[License](#license)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

The node provides two action types:

### Search

A simplified mode for running search queries against OpenSearch.

- **Index** — Select an index or alias from a dynamic dropdown, or leave empty to search all indices.
- **Query Body** — The search query in JSON format (defaults to `match_all`).

### Advanced

Full control over the OpenSearch REST API.

- **HTTP Method** — GET, POST, PUT, DELETE, or HEAD.
- **Path** — Any API path, e.g. `my-index/_search`, `_cat/indices`, `_cluster/health`.
- **Query Body** — Request body in JSON format (shown for POST/PUT only).

### Options

Both modes support the following optional settings:

| Option | Description |
|--------|-------------|
| Timeout | Request timeout in milliseconds (default: 30000) |
| Skip SSL Certificate Validation | Skip SSL verification (not recommended for production) |
| Return Full Response | Return status code, headers, and body instead of body only |
| Ignore HTTP Status Errors | Do not throw on 4xx/5xx responses |
| Disable Follow Redirect | Do not follow HTTP redirects |
| Query Parameters | Additional URL query parameters as JSON |
| Proxy URL | HTTP proxy in `http://host:port` format |

## Credentials

**No credentials configuration is needed.** The node uses the [AWS default credential provider chain](https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html#credentialProviderChain) to obtain IAM credentials automatically. This supports:

- EC2 instance IAM roles (instance metadata)
- ECS task IAM roles
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`)
- Shared credentials file (`~/.aws/credentials`)
- SSO / Web identity tokens

Make sure the IAM role attached to your compute environment has the necessary OpenSearch permissions (e.g. `es:ESHttpGet`, `es:ESHttpPost`).

## Compatibility

- Requires n8n v1.0 or later

## Usage

1. Add the **Amazon OpenSearch** node to your workflow.
2. Enter your OpenSearch domain **Endpoint** (e.g. `https://search-my-domain-xxx.us-east-1.es.amazonaws.com`).
3. Select a **Region** or leave it as "Auto-Detect From Endpoint".
4. Choose **Search** mode to query an index, or **Advanced** mode for any API call.
5. Run the workflow.

### Example: Search all documents in an index

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

### Example: Check cluster health (Advanced)

- Action Type: **Advanced**
- HTTP Method: **GET**
- Path: `_cluster/health`

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Amazon OpenSearch Service documentation](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/)
- [OpenSearch REST API reference](https://opensearch.org/docs/latest/api-reference/)

## License

[MIT](LICENSE)
