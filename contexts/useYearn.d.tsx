import {BigNumberish} from 'ethers';

export type TToken = {
	name: string,
	symbol: string,
	address: string,
	decimals: number,
	display_name: string,
	icon: string
}
export type TTVL = {
	total_assets: BigNumberish,
	tvl: number,
	price: number
}
export type TAPY = {
	type: string,
	gross_apr: number,
	net_apy: number,
	fees: {
		performance: number | null,
		withdrawal: number | null,
		management: number | null,
		keep_crv: number | null,
		cvx_keep_crv: number | null
	}
	points?: {
		week_ago: number,
		month_ago: number,
		inception: number
	}
	composite?: {
		boost: number,
		pool_apy: number,
		boosted_apr: number,
		base_apr: number,
		cvx_apr: number,
		rewards_apr: number,
	},
}

export type TStrategies = {
    name: string;
    address: string;
}

export type TVaultAPI = {
	inception: number,
    address: string,
    symbol: string,
    name: string,
    display_name: string,
    icon: string,
    token: TToken,
    tvl: TTVL,
	apy: TAPY,
	strategies: TStrategies[],
    endorsed: boolean,
    version: string,
    decimals: number,
    type: string,
    emergency_shutdown: boolean,
	updated: number,
	migration?: {
		available: boolean,
		address: string
	}
};

export type TVault = TVaultAPI & {
	chainID: number,
	description: string,
	categories: string[],
	strategies: (TStrategies & {
		description: string
	})[],
	apy: {
		net_apy: number,
		points: {
			week_ago: number,
			month_ago: number,
			inception: number
		}
	}
};