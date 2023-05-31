import React, {ReactElement, useContext, createContext} from 'react';
import axios from 'axios';
import NProgress from 'nprogress';
import {useRouter} from 'next/router';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {useSettings} from '@yearn-finance/web-lib/contexts/useSettings';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {WalletContextApp} from 'contexts/useWallet';
import {ETH_YVDAI, ETH_YVUSDC, ETH_YVUSDT, ETH_YVYFI, ETH_YVETH, ETH_YVBTC, FTM_YVWFTM, FTM_YVUSDC, FTM_YVDAI, FTM_YVUSDT, FTM_YVWETH, FTM_YVWBTC, FTM_YVYFI} from 'components/common/constants';

import type {TToken, TVault, TVaultAPI} from 'contexts/useYearn.d';

type TYearnContext = {
	vaults: TVault[],
	nonce: number,
	defaultCategories: string[]
}

enum Categories {
	SimpleSaver = 'Simple Saver',
	USDStable = 'USD Stable',
	BlueChip = 'Blue Chip'
}

const YearnContext = createContext<TYearnContext>({
	vaults: [],
	nonce: 0,
	defaultCategories: [Categories.SimpleSaver, Categories.USDStable, Categories.BlueChip]
});

export const YearnContextApp = ({children}: { children: ReactElement }): ReactElement => {
	const web3 = useWeb3();
	const {networks} = useSettings();
	const [vaults, set_vaults] = React.useState<TVault[]>([]);
	const [nonce, set_nonce] = React.useState(0);
	const [defaultCategories, set_defaultCategories] = React.useState<string[]>([]);
	const router = useRouter();
	const {chainID} = router.query;

	const getYearnVaults = React.useCallback(async (): Promise<void> => {
		NProgress.start();

		if (typeof chainID !== 'undefined' && typeof chainID !== 'string') {
			return;
		}

		const parsedChainID = (chainID ? (chainID === '1337' ? '1' : chainID) : String(web3.chainID)) || '1';

		const networkData = networks[Number(parsedChainID)];

		const [api, meta, tok, vs] = await Promise.allSettled([
			axios.get(`${networkData.apiURI}/vaults/all`),
			axios.get(`${networkData.metaURI}/strategies/all`),
			axios.get(`${networkData.metaURI}/tokens/all`),
			axios.get(`${networkData.metaURI}/vaults/all`)
		]);

		let strategies = [], tokens = [], vaults = [];

		if (api.status === 'rejected') {
			console.error(`failed to fetch vaults: ${api.reason}`);
			return;
		}
		vaults = api.value.data;

		if (meta.status === 'rejected') {
			console.error(`failed to fetch meta: ${meta.reason}`);
		} else {
			strategies = meta.value.data;
		}
		if (tok.status === 'rejected') {
			console.error(`failed to fetch tok: ${tok.reason}`);
		} else {
			tokens = tok.value.data;
		}
		if (vs.status === 'rejected') {
			console.error(`failed to fetch tok: ${vs.reason}`);
		} else {
			vs.value.data;
		}

		/* 🔵 - Yearn Finance **************************************************
		** Do you want to display all the vaults, or just a selection ?
		** You can use this filter function to add some conditions for the
		** vaults to work with.
		**********************************************************************/
		const endorsedVaults: { [key: number]: string[] } = {
			1: [ETH_YVDAI, ETH_YVUSDC, ETH_YVUSDT, ETH_YVYFI, ETH_YVETH, ETH_YVBTC],
			250: [FTM_YVWFTM, FTM_YVUSDC, FTM_YVDAI, FTM_YVUSDT, FTM_YVWETH, FTM_YVWBTC, FTM_YVYFI]
		};

		vaults = vaults.filter((vault: TVaultAPI): boolean => {
			/* 🔵 - Yearn Finance **********************************************
			** If a migration is available, this means it's not the latest
			** vault for this underlying. Skip it for our UI.
			******************************************************************/
			if (vault?.migration?.available) {
				return false;
			}

			/* 🔵 - Yearn Finance **********************************************
			** For this project need, we have a list of 6 vaults we would like
			** to endorse. If the vault's address match one of them, include it
			** in the final list.
			******************************************************************/
			if (endorsedVaults[Number(parsedChainID)].includes(toAddress(vault.address))) {
				return true;
			}
			return false;
		});

		/* 🔵 - Yearn Finance **************************************************
		** Prepare the return data. We fetched data from the relevant source and
		** filtered the elements we needed. Now we can try to group the data
		** together to have some correct complet data to work with.
		**********************************************************************/
		const _vaults: TVault[] = [];
		for (const vault of vaults) {
			/* 🔵 - Yearn Finance **********************************************
			** First, let's try to find the description for the underlying
			** token, as provided by meta.yearn.finance.
			******************************************************************/
			vault.description = tokens.find((token: TToken): boolean => (
				toAddress(token.address) === toAddress(vault.token.address)
			))?.description || '';

			/* 🔵 - Yearn Finance **********************************************
			** Then let's do the same for the vault's strategies. The official
			** api.yearn.finance api send us the list of strategies attached to
			** each vault, but without display name or description. Fix it by
			** grouping data with meta.yearn.finance.
			******************************************************************/
			const _strategies = [];
			for (const strat of vault.strategies) {
				const stratMeta = strategies.find((s: any): boolean => s.addresses.includes(strat.address));
				if (stratMeta) {
					_strategies.push({
						display_name: stratMeta.name,
						description: stratMeta.description,
						protocols: stratMeta.protocols,
						...strat
					});
				} else {
					_strategies.push(strat);
				}
			}
			vault.strategies = _strategies;

			/* 🔵 - Yearn Finance **********************************************
			** The API may have empty points data for the APY. We don't want
			** our app to get some undefined issue, so we add a fail-safe here
			******************************************************************/
			if (!vault?.apy?.points?.inception) {
				vault.apy.points = {
					week_ago: 0,
					month_ago: 0,
					inception: 0
				};
			}

			/* 🔵 - Yearn Finance **********************************************
			** You need to override, replace, update some other elements? Feel
			** free to put whatever you need here. The idea is to have easy to
			** access accurate data accross your app. For example, let's change
			** some token symbol and add some "type" for the vaults.
			******************************************************************/
			if (vault.token.symbol === 'yDAI+yUSDC+yUSDT+yBUSD')
				vault.token.symbol = 'yBUSD';
			if (vault.token.symbol === 'yDAI+yUSDC+yUSDT+yTUSD')
				vault.token.symbol = 'yCRV';
			if (vault.token.symbol === 'cDAI+cUSDC+USDT')
				vault.token.symbol = 'cUSDT';

			vault.categories = [Categories.SimpleSaver];
			vault.chainID = parsedChainID;

			const vaultCategoryMap = {
				'1_1337': {
					[ETH_YVDAI]: [Categories.USDStable],
					[ETH_YVUSDC]: [Categories.USDStable],
					[ETH_YVUSDT]: [Categories.USDStable],
					[ETH_YVYFI]: [Categories.BlueChip],
					[ETH_YVETH]: [Categories.BlueChip],
					[ETH_YVBTC]: [Categories.BlueChip]
				},
				'250': {
					[FTM_YVUSDC]: [Categories.USDStable],
					[FTM_YVDAI]: [Categories.USDStable],
					[FTM_YVUSDT]: [Categories.USDStable],
					[FTM_YVWFTM]: [Categories.BlueChip],
					[FTM_YVWETH]: [Categories.BlueChip],
					[FTM_YVWBTC]: [Categories.BlueChip],
					[FTM_YVYFI]: [Categories.BlueChip]
				}
			};

			const chainKey = ['1', '1337'].includes(parsedChainID) ? '1_1337' : parsedChainID;

			if (!isValidChain(chainKey)) {
				return;
			}

			const addressCategories = vaultCategoryMap[chainKey][toAddress(vault.address)];

			if (addressCategories) {
				vault.categories = [...vault.categories, ...addressCategories];
			}

			_vaults.push(vault);
		}

		performBatchedUpdates((): void => {
			set_vaults(_vaults);
			set_nonce((n): number => n + 1);
			set_defaultCategories([...new Set(_vaults.map(({categories}): string[] => categories).flat())]);
			NProgress.done();
		});
	}, [chainID, networks, web3.chainID]);

	React.useEffect((): void => {
		getYearnVaults();
	}, [getYearnVaults]);

	return (
		<YearnContext.Provider value={{vaults, nonce, defaultCategories}}>
			<WalletContextApp vaults={vaults}>
				{children}
			</WalletContextApp>
		</YearnContext.Provider>
	);
};

function isValidChain(chainID?: string | string[]): chainID is '1_1337' | '250' {
	if (typeof chainID !== 'string') {
		return false;
	}
	return ['1_1337', '250'].includes(chainID);
}

export const useYearn = (): TYearnContext => useContext(YearnContext);
export default useYearn;
