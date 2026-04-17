import type { ILoadOptionsFunctions } from 'n8n-workflow';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import aws4 from 'aws4';

/**
 * Extract the AWS region from an OpenSearch endpoint URL.
 * Returns undefined if the region cannot be inferred.
 */
export function extractRegionFromEndpoint(endpoint: string): string | undefined {
	const match = endpoint.match(
		/\.([a-z]{2}-[a-z]+-\d+|us-gov-[a-z]+-\d+|cn-[a-z]+-\d+)\.es\.amazonaws\.com/,
	);
	return match?.[1];
}

export interface SignedRequestParams {
	endpoint: string;
	region: string;
	method: string;
	path: string;
	body?: string;
	timeout?: number;
}

/**
 * Send an HTTP request signed with AWS Signature V4.
 * Credentials are resolved automatically via the default provider chain
 * (environment variables, EC2 instance role, ECS task role, etc.).
 */
export async function signedRequest(
	helpers: Pick<ILoadOptionsFunctions['helpers'], 'httpRequest'>,
	params: SignedRequestParams,
): Promise<unknown> {
	const url = new URL(params.endpoint);
	const credentialProvider = fromNodeProviderChain();
	const credentials = await credentialProvider();

	const signOptions: aws4.Request = {
		host: url.host,
		method: params.method,
		path: `/${params.path}`,
		service: 'es',
		region: params.region,
		headers: { 'Content-Type': 'application/json' },
	};

	if (params.body) {
		signOptions.body = params.body;
	}

	const signed = aws4.sign(signOptions, {
		accessKeyId: credentials.accessKeyId,
		secretAccessKey: credentials.secretAccessKey,
		sessionToken: credentials.sessionToken,
	});

	return await helpers.httpRequest({
		method: params.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
		url: `${params.endpoint}/${params.path}`,
		headers: signed.headers as Record<string, string>,
		body: params.body,
		json: false,
		timeout: params.timeout ?? 30000,
	});
}
