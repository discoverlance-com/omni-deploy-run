export const SUPPORTED_CLOUD_RUN_LOCATIONS = [
	{
		value: 'africa-south1',
		label: 'africa-south1 (Johannesburg)',
	},
	{
		value: 'northamerica-northeast1',
		label: 'northamerica-northeast1 (Montréal)',
	},
	{
		value: 'northamerica-northeast2',
		label: 'northamerica-northeast2 (Toronto)',
	},
	{
		value: 'northamerica-south1',
		label: 'northamerica-south1 (Mexico)',
	},
	{
		value: 'southamerica-east1',
		label: 'southamerica-east1 (São Paulo)',
	},
	{
		value: 'southamerica-west1',
		label: 'southamerica-west1 (Santiago)',
	},
	{
		value: 'us-central1',
		label: 'us-central1 (Iowa)',
	},
	{
		value: 'us-east1',
		label: 'us-east1 (South Carolina)',
	},
	{
		value: 'us-east4',
		label: 'us-east4 (Northern Virginia)',
	},
	{
		value: 'us-east5',
		label: 'us-east5 (Columbus)',
	},
	{
		value: 'us-south1',
		label: 'us-south1 (Dallas)',
	},
	{
		value: 'us-west1',
		label: 'us-west1 (Oregon)',
	},
	{
		value: 'us-west2',
		label: 'us-west2 (Los Angeles)',
	},
	{
		value: 'us-west3',
		label: 'us-west3 (Salt Lake City)',
	},
	{
		value: 'us-west4',
		label: 'us-west4 (Las Vegas)',
	},
	{
		value: 'asia-east1',
		label: 'asia-east1 (Taiwan)',
	},
	{
		value: 'asia-east2',
		label: 'asia-east2 (Hong Kong)',
	},
	{
		value: 'asia-northeast1',
		label: 'asia-northeast1 (Tokyo)',
	},
	{
		value: 'asia-northeast2',
		label: 'asia-northeast2 (Osaka)',
	},
	{
		value: 'asia-northeast3',
		label: 'asia-northeast3 (Seoul)',
	},
	{
		value: 'asia-south1',
		label: 'asia-south1 (Mumbai)',
	},
	{
		value: 'asia-south2',
		label: 'asia-south2 (Delhi)',
	},
	{
		value: 'asia-southeast1',
		label: 'asia-southeast1 (Singapore)',
	},
	{
		value: 'asia-southeast2',
		label: 'asia-southeast2 (Jakarta)',
	},
	{
		value: 'australia-southeast1',
		label: 'australia-southeast1 (Sydney)',
	},
	{
		value: 'australia-southeast2',
		label: 'australia-southeast2 (Melbourne)',
	},
	{
		value: 'europe-central2',
		label: 'europe-central2 (Warsaw)',
	},
	{
		value: 'europe-north1',
		label: 'europe-north1 (Finland)',
	},
	{
		value: 'europe-north2',
		label: 'europe-north2 (Stockholm)',
	},
	{
		value: 'europe-southwest1',
		label: 'europe-southwest1 (Madrid)',
	},
	{
		value: 'europe-west1',
		label: 'europe-west1 (Belgium)',
	},
	{
		value: 'europe-west2',
		label: 'europe-west2 (London)',
	},
	{
		value: 'europe-west3',
		label: 'europe-west3 (Frankfurt)',
	},
	{
		value: 'europe-west4',
		label: 'europe-west4 (Netherlands)',
	},
	{
		value: 'europe-west6',
		label: 'europe-west6 (Zurich)',
	},
	{
		value: 'europe-west8',
		label: 'europe-west8 (Milan)',
	},
	{
		value: 'europe-west9',
		label: 'europe-west9 (Paris)',
	},
	{
		value: 'europe-west10',
		label: 'europe-west10 (Berlin)',
	},
	{
		value: 'europe-west12',
		label: 'europe-west12 (Turin)',
	},
	{
		value: 'me-central1',
		label: 'me-central1 (Doha)',
	},
	{
		value: 'me-central2',
		label: 'me-central2 (Dammam)',
	},
	{
		value: 'me-west1',
		label: 'me-west1 (Tel Aviv)',
	},
] as const

export type CloudRunLocation =
	(typeof SUPPORTED_CLOUD_RUN_LOCATIONS)[number]['value']

export const SUPPORTED_CLOUD_RUN_MEMORY_OPTIONS = [
	{ value: '128Mi', label: '128 MiB' },
	{ value: '256Mi', label: '256 MiB' },
	{ value: '512Mi', label: '512 MiB' },
	{ value: '1Gi', label: '1 GiB' },
	{ value: '2Gi', label: '2 GiB' },
	{ value: '4Gi', label: '4 GiB' },
	{ value: '8Gi', label: '8 GiB' },
	{ value: '16Gi', label: '16 GiB' },
	{ value: '32Gi', label: '32 GiB' },
] as const

export type CloudRunMemoryOption =
	(typeof SUPPORTED_CLOUD_RUN_MEMORY_OPTIONS)[number]['value']
