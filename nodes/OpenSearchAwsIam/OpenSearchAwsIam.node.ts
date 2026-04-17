import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError, NodeOperationError } from 'n8n-workflow';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import aws4 from 'aws4';

import { extractRegionFromEndpoint } from './utils/awsSignature';
import { loadOptions } from './methods/loadOptions';
import {
	commonProperties,
	searchProperties,
	advancedProperties,
	optionsProperty,
} from './descriptions/properties';

export class OpenSearchAwsIam implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Amazon OpenSearch (AWS IAM)',
		name: 'openSearchAwsIam',
		icon: 'file:openSearchAwsIam.svg',
		group: ['input'],
		version: [1],
		subtitle:
			'={{$parameter["actionType"] === "search" ? "Search " + ($parameter["index"] || "") : $parameter["httpMethod"] + " " + $parameter["path"]}}',
		description: 'Query Amazon OpenSearch with IAM role authentication',
		defaults: {
			name: 'Amazon OpenSearch (AWS IAM)',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			...commonProperties,
			...searchProperties,
			...advancedProperties,
			optionsProperty,
		],
	};

	methods = { loadOptions };

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const endpoint = (
					this.getNodeParameter('endpoint', i) as string
				).replace(/\/+$/, '');
				const actionType = this.getNodeParameter('actionType', i) as string;
				let region = this.getNodeParameter('region', i) as string;

				// Determine httpMethod, path, and body based on actionType
				let httpMethod: string;
				let path: string;
				let body: string | undefined;

				if (actionType === 'search') {
					httpMethod = 'POST';
					const index = this.getNodeParameter('index', i, '') as string;
					path = index ? `${index}/_search` : '_search';
					const queryBody = this.getNodeParameter('queryBody', i, '{}') as string;
					body = typeof queryBody === 'string' ? queryBody : JSON.stringify(queryBody);
				} else {
					httpMethod = this.getNodeParameter('httpMethod', i) as string;
					path = (this.getNodeParameter('path', i) as string).replace(/^\/+/, '');
					if (httpMethod === 'POST' || httpMethod === 'PUT') {
						const queryBody = this.getNodeParameter(
							'queryBodyAdvanced',
							i,
							'{}',
						) as string;
						body =
							typeof queryBody === 'string'
								? queryBody
								: JSON.stringify(queryBody);
					}
				}

				// Resolve region
				if (!region) {
					const detected = extractRegionFromEndpoint(endpoint);
					if (detected) {
						region = detected;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							'Cannot detect AWS region from the endpoint. Please select a region manually.',
							{ itemIndex: i },
						);
					}
				}

				// Parse host from endpoint
				let host: string;
				try {
					host = new URL(endpoint).host;
				} catch {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid endpoint format: ${endpoint}`,
						{ itemIndex: i },
					);
				}

				// Obtain IAM credentials from the default provider chain
				const credentialProvider = fromNodeProviderChain();
				const credentials = await credentialProvider();

				// Build and sign the request with AWS SigV4
				const signOptions: aws4.Request = {
					host,
					method: httpMethod,
					path: `/${path}`,
					service: 'es',
					region,
					headers: { 'Content-Type': 'application/json' },
				};
				if (body) {
					signOptions.body = body;
				}

				const signed = aws4.sign(signOptions, {
					accessKeyId: credentials.accessKeyId,
					secretAccessKey: credentials.secretAccessKey,
					sessionToken: credentials.sessionToken,
				});

				// Read user-configured options
				const options = this.getNodeParameter('options', i, {}) as IDataObject;
				const timeout = (options.timeout as number) ?? 30000;
				const skipSslCertificateValidation =
					(options.skipSslCertificateValidation as boolean) ?? false;
				const returnFullResponse =
					(options.returnFullResponse as boolean) ?? false;
				const ignoreHttpStatusErrors =
					(options.ignoreHttpStatusErrors as boolean) ?? false;
				const disableFollowRedirect =
					(options.disableFollowRedirect as boolean) ?? false;

				// Parse query parameters
				let qs: IDataObject | undefined;
				const queryParametersRaw = options.queryParameters as string;
				if (queryParametersRaw) {
					try {
						qs = JSON.parse(queryParametersRaw) as IDataObject;
					} catch {
						throw new NodeOperationError(
							this.getNode(),
							'Invalid Query Parameters format. Please enter valid JSON.',
							{ itemIndex: i },
						);
					}
				}

				// Parse proxy configuration
				let proxy:
					| { host: string; port: number; protocol?: string }
					| undefined;
				const proxyUrl = options.proxy as string;
				if (proxyUrl) {
					try {
						const parsed = new URL(proxyUrl);
						proxy = {
							host: parsed.hostname,
							port: Number(parsed.port) || 8080,
							protocol: parsed.protocol.replace(':', ''),
						};
					} catch {
						throw new NodeOperationError(
							this.getNode(),
							`Invalid Proxy URL format: ${proxyUrl}`,
							{ itemIndex: i },
						);
					}
				}

				// Send the signed request
				const response = await this.helpers.httpRequest({
					method: httpMethod as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
					url: `${endpoint}/${path}`,
					headers: signed.headers as Record<string, string>,
					body,
					qs,
					json: false,
					returnFullResponse,
					skipSslCertificateValidation,
					ignoreHttpStatusErrors,
					disableFollowRedirect,
					proxy,
					timeout,
				});

				// Parse JSON response manually (json: false was used to preserve SigV4 body)
				let parsedResponse: unknown;
				try {
					parsedResponse =
						typeof response === 'string' ? JSON.parse(response) : response;
				} catch {
					parsedResponse = { rawResponse: response };
				}

				if (typeof parsedResponse === 'object' && parsedResponse !== null) {
					returnData.push({
						json: parsedResponse as IDataObject,
						pairedItem: { item: i },
					});
				} else {
					returnData.push({
						json: { result: parsedResponse } as IDataObject,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}

				if ((error as Record<string, unknown>).statusCode) {
					throw new NodeApiError(
						this.getNode(),
						error as Record<string, string>,
						{ itemIndex: i },
					);
				}

				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
