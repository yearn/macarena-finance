import 	{BigNumber}		from	'ethers';
import	{TVault}		from	'contexts/useYearn.d';

export type	TBalances = {
	[address: string]: {
		raw: BigNumber,
		normalized: number
	}
}
export type	TAllowances = {
	[address: string]: {
		raw: BigNumber,
		normalized: number
	}
}
export type	TPrices = {
	[address: string]: {
		raw: BigNumber,
		normalized: number
	}
}

export type	TWalletContext = {
	balances: TBalances,
	allowances: TAllowances,
	prices: TPrices,
	useWalletNonce: number,
	updateVaultData: (vault: TVault) => Promise<void>
}
