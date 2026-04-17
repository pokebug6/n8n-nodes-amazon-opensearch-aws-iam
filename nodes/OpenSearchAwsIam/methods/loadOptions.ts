import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';
import { extractRegionFromEndpoint, signedRequest } from '../utils/awsSignature';

/** loadOptions methods exposed on the node class. */
export const loadOptions = {
	/** Dynamically load the list of OpenSearch indices and aliases. */
	async getIndices(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		const results: INodePropertyOptions[] = [
			{ name: '-- None (Do Not Prepend Index) --', value: '' },
		];

		try {
			const endpoint = (this.getNodeParameter('endpoint') as string).replace(
				/\/+$/,
				'',
			);
			if (!endpoint) return results;

			let region = this.getNodeParameter('region') as string;
			if (!region) {
				region = extractRegionFromEndpoint(endpoint) ?? '';
			}
			if (!region) return results;

			// Fetch indices and aliases in parallel
			const [indicesResponse, aliasesResponse] = await Promise.all([
				signedRequest(this.helpers, {
					endpoint,
					region,
					method: 'GET',
					path: '_cat/indices?format=json&h=index',
					timeout: 10000,
				}),
				signedRequest(this.helpers, {
					endpoint,
					region,
					method: 'GET',
					path: '_cat/aliases?format=json&h=alias',
					timeout: 10000,
				}),
			]);

			const seen = new Set<string>();

			// Parse indices
			const parsedIndices =
				typeof indicesResponse === 'string'
					? JSON.parse(indicesResponse)
					: indicesResponse;

			if (Array.isArray(parsedIndices)) {
				for (const item of parsedIndices) {
					const indexName = (item as IDataObject).index as string;
					if (indexName && !indexName.startsWith('.') && !seen.has(indexName)) {
						seen.add(indexName);
						results.push({
							name: `${indexName} (index)`,
							value: indexName,
						});
					}
				}
			}

			// Parse aliases
			const parsedAliases =
				typeof aliasesResponse === 'string'
					? JSON.parse(aliasesResponse)
					: aliasesResponse;

			if (Array.isArray(parsedAliases)) {
				for (const item of parsedAliases) {
					const aliasName = (item as IDataObject).alias as string;
					if (aliasName && !aliasName.startsWith('.') && !seen.has(aliasName)) {
						seen.add(aliasName);
						results.push({
							name: `${aliasName} (alias)`,
							value: aliasName,
						});
					}
				}
			}

			// Sort alphabetically, keeping the "None" option first
			results.sort((a, b) => {
				if (a.value === '') return -1;
				if (b.value === '') return 1;
				return (a.name as string).localeCompare(b.name as string);
			});
		} catch {
			// If fetching fails, return the empty list so the user
			// can still type an index name manually via expression.
		}

		return results;
	},
};
