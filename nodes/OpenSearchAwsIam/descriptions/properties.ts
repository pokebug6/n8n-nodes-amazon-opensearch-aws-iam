import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

/** All supported AWS regions for the Region dropdown. */
export const AWS_REGIONS: INodePropertyOptions[] = [
	{ name: 'Auto-Detect From Endpoint', value: '' },
	{ name: 'US East (N. Virginia) - Us-East-1', value: 'us-east-1' },
	{ name: 'US East (Ohio) - Us-East-2', value: 'us-east-2' },
	{ name: 'US West (N. California) - Us-West-1', value: 'us-west-1' },
	{ name: 'US West (Oregon) - Us-West-2', value: 'us-west-2' },
	{ name: 'Africa (Cape Town) - Af-South-1', value: 'af-south-1' },
	{ name: 'Asia Pacific (Hong Kong) - Ap-East-1', value: 'ap-east-1' },
	{ name: 'Asia Pacific (Hyderabad) - Ap-South-2', value: 'ap-south-2' },
	{ name: 'Asia Pacific (Jakarta) - Ap-Southeast-3', value: 'ap-southeast-3' },
	{ name: 'Asia Pacific (Melbourne) - Ap-Southeast-4', value: 'ap-southeast-4' },
	{ name: 'Asia Pacific (Mumbai) - Ap-South-1', value: 'ap-south-1' },
	{ name: 'Asia Pacific (Osaka) - Ap-Northeast-3', value: 'ap-northeast-3' },
	{ name: 'Asia Pacific (Seoul) - Ap-Northeast-2', value: 'ap-northeast-2' },
	{ name: 'Asia Pacific (Singapore) - Ap-Southeast-1', value: 'ap-southeast-1' },
	{ name: 'Asia Pacific (Sydney) - Ap-Southeast-2', value: 'ap-southeast-2' },
	{ name: 'Asia Pacific (Tokyo) - Ap-Northeast-1', value: 'ap-northeast-1' },
	{ name: 'Canada (Central) - Ca-Central-1', value: 'ca-central-1' },
	{ name: 'Canada West (Calgary) - Ca-West-1', value: 'ca-west-1' },
	{ name: 'Europe (Frankfurt) - Eu-Central-1', value: 'eu-central-1' },
	{ name: 'Europe (Ireland) - Eu-West-1', value: 'eu-west-1' },
	{ name: 'Europe (London) - Eu-West-2', value: 'eu-west-2' },
	{ name: 'Europe (Milan) - Eu-South-1', value: 'eu-south-1' },
	{ name: 'Europe (Paris) - Eu-West-3', value: 'eu-west-3' },
	{ name: 'Europe (Spain) - Eu-South-2', value: 'eu-south-2' },
	{ name: 'Europe (Stockholm) - Eu-North-1', value: 'eu-north-1' },
	{ name: 'Europe (Zurich) - Eu-Central-2', value: 'eu-central-2' },
	{ name: 'Israel (Tel Aviv) - Il-Central-1', value: 'il-central-1' },
	{ name: 'Middle East (Bahrain) - Me-South-1', value: 'me-south-1' },
	{ name: 'Middle East (UAE) - Me-Central-1', value: 'me-central-1' },
	{ name: 'South America (São Paulo) - Sa-East-1', value: 'sa-east-1' },
	{ name: 'AWS GovCloud (US-East) - Us-Gov-East-1', value: 'us-gov-east-1' },
	{ name: 'AWS GovCloud (US-West) - Us-Gov-West-1', value: 'us-gov-west-1' },
	{ name: 'China (Beijing) - Cn-North-1', value: 'cn-north-1' },
	{ name: 'China (Ningxia) - Cn-Northwest-1', value: 'cn-northwest-1' },
];

/** Common properties shared by all action types. */
export const commonProperties: INodeProperties[] = [
	{
		displayName: 'Endpoint',
		name: 'endpoint',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://search-my-domain-xxx.us-east-1.es.amazonaws.com',
		description: 'The OpenSearch domain endpoint URL (without trailing slash)',
	},
	{
		displayName: 'Region',
		name: 'region',
		type: 'options',
		noDataExpression: true,
		options: AWS_REGIONS,
		default: '',
		description:
			'AWS region. Select "Auto-Detect From Endpoint" to infer automatically from the endpoint URL.',
	},
	{
		displayName: 'Action Type',
		name: 'actionType',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Search',
				value: 'search',
				description: 'Execute a search query on an index',
				action: 'Search an index',
			},
			{
				name: 'Advanced',
				value: 'advanced',
				description: 'Custom HTTP method and path for any OpenSearch API call',
				action: 'Execute an advanced API call',
			},
		],
		default: 'search',
	},
];

/** Properties visible only in Search mode. */
export const searchProperties: INodeProperties[] = [
	{
		displayName: 'Index Name or ID',
		name: 'index',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getIndices',
			loadOptionsDependsOn: ['endpoint', 'region'],
		},
		default: '',
		description:
			'The index to query. Leave empty to search all indices. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: { actionType: ['search'] },
		},
	},
	{
		displayName: 'Query Body',
		name: 'queryBody',
		type: 'json',
		default: '{\n  "query": {\n    "match_all": {}\n  }\n}',
		description: 'The search query body in JSON format',
		displayOptions: {
			show: { actionType: ['search'] },
		},
	},
];

/** Properties visible only in Advanced mode. */
export const advancedProperties: INodeProperties[] = [
	{
		displayName: 'HTTP Method',
		name: 'httpMethod',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'DELETE', value: 'DELETE' },
			{ name: 'GET', value: 'GET' },
			{ name: 'HEAD', value: 'HEAD' },
			{ name: 'POST', value: 'POST' },
			{ name: 'PUT', value: 'PUT' },
		],
		default: 'POST',
		description: 'The HTTP method to use for the request',
		displayOptions: {
			show: { actionType: ['advanced'] },
		},
	},
	{
		displayName: 'Path',
		name: 'path',
		type: 'string',
		required: true,
		default: '_search',
		placeholder: 'my-index/_search',
		description:
			'API path (without leading slash), e.g. _search, my-index/_search, _cat/indices',
		displayOptions: {
			show: { actionType: ['advanced'] },
		},
	},
	{
		displayName: 'Query Body',
		name: 'queryBodyAdvanced',
		type: 'json',
		default: '{}',
		description:
			'The request body in JSON format. Can be left empty for GET/HEAD/DELETE methods.',
		displayOptions: {
			show: {
				actionType: ['advanced'],
				httpMethod: ['POST', 'PUT'],
			},
		},
	},
];

/** Optional HTTP request settings. */
export const optionsProperty: INodeProperties = {
	displayName: 'Options',
	name: 'options',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	options: [
		{
			displayName: 'Disable Follow Redirect',
			name: 'disableFollowRedirect',
			type: 'boolean',
			default: false,
			description: 'Whether to not follow HTTP redirects',
		},
		{
			displayName: 'Ignore HTTP Status Errors',
			name: 'ignoreHttpStatusErrors',
			type: 'boolean',
			default: false,
			description:
				'Whether to succeed even when the HTTP status code indicates an error (4xx, 5xx)',
		},
		{
			displayName: 'Proxy URL',
			name: 'proxy',
			type: 'string',
			default: '',
			placeholder: 'http://proxy.example.com:8080',
			description: 'HTTP proxy URL (format: http://host:port)',
		},
		{
			displayName: 'Query Parameters',
			name: 'queryParameters',
			type: 'json',
			default: '{}',
			description:
				'Additional query parameters appended to the URL (JSON format), e.g. {"pretty": "true"}',
		},
		{
			displayName: 'Return Full Response',
			name: 'returnFullResponse',
			type: 'boolean',
			default: false,
			description:
				'Whether to return the full response (status code, headers, body) instead of just the body',
		},
		{
			displayName: 'Skip SSL Certificate Validation',
			name: 'skipSslCertificateValidation',
			type: 'boolean',
			default: false,
			description:
				'Whether to skip SSL certificate validation (not recommended for production)',
		},
		{
			displayName: 'Timeout',
			name: 'timeout',
			type: 'number',
			default: 30000,
			description: 'Request timeout in milliseconds',
		},
	],
};
