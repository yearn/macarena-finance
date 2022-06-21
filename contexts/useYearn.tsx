import	React, {ReactElement, useContext, createContext}	from	'react';
import	axios												from	'axios';
import	NProgress											from	'nprogress';
import	{useSettings, useWeb3}								from	'@yearn-finance/web-lib/contexts';
import	{performBatchedUpdates, toAddress}					from	'@yearn-finance/web-lib/utils';
import	{WalletContextApp}									from	'contexts/useWallet';
import type {TToken, TVault, TVaultAPI}						from	'contexts/useYearn.d';

type	TYearnContext = {
	vaults: TVault[],
	nonce: number,
	defaultCategories: string[]
}
const	YearnContext = createContext<TYearnContext>({
	vaults: [],
	nonce: 0,
	defaultCategories: ['Simple Saver', 'USD Stable', 'Blue Chip']
});
export const YearnContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	{chainID} = useWeb3();
	const	{networks} = useSettings();
	const	[vaults, set_vaults] = React.useState<TVault[]>([]);
	const	[nonce, set_nonce] = React.useState(0);
	const	[defaultCategories, set_defaultCategories] = React.useState<string[]>([]);

	const getYearnVaults = React.useCallback(async (): Promise<void> => {
		NProgress.start();
		const	networkData = networks[chainID === 1337 ? 1 : chainID || 1];
		const	[api, meta, tok, vs] = await Promise.allSettled([
			axios.get(`${networkData.apiURI}/vaults/all`),
			axios.get(`${networkData.metaURI}/strategies/all`),
			axios.get(`${networkData.metaURI}/tokens/all`),
			axios.get(`${networkData.metaURI}/vaults/all`)
		]);

		let	strategies = [];
		let tokens = [];
		let vaults = [];
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
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			vs.value.data;
		}

		/* 🔵 - Yearn Finance **************************************************
		** Do you want to display all the vaults, or just a selection ?
		** You can use this filter function to add some conditions for the
		** vaults to work with.
		**********************************************************************/
		const	endorsedVaults: {[key: number]: string[]} = {
			1: [
				toAddress('0xdA816459F1AB5631232FE5e97a05BBBb94970c95'), //yvDAI
				toAddress('0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE'), //yvUSDC
				toAddress('0x7Da96a3891Add058AdA2E826306D812C638D87a7'), //yvUSDT
				toAddress('0xdb25cA703181E7484a155DD612b06f57E12Be5F0'), //yvYFI
				toAddress('0xa258C4606Ca8206D8aA700cE2143D7db854D168c'), //yvETH
				toAddress('0xA696a63cc78DfFa1a63E9E50587C197387FF6C7E')  //yvBTC
			],
			250 : [
				toAddress('0x0DEC85e74A92c52b7F708c4B10207D9560CEFaf0'), // yvWFTM
				toAddress('0xEF0210eB96c7EB36AF8ed1c20306462764935607'), // yvUSDC
				toAddress('0x637eC617c86D24E421328e6CAEa1d92114892439'), // yvDAI
				toAddress('0x148c05caf1Bb09B5670f00D511718f733C54bC4c'), // yvUSDT
				toAddress('0xCe2Fc0bDc18BD6a4d9A725791A3DEe33F3a23BB7'), // yvWETH
				toAddress('0xd817A100AB8A29fE3DBd925c2EB489D67F758DA9'), // yvWBTC
				toAddress('0x2C850cceD00ce2b14AA9D658b7Cad5dF659493Db')  // yvYFI
			]
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
			if (endorsedVaults[chainID === 1337 ? 1 : chainID || 1].includes(toAddress(vault.address))) {
				return true;
			}
			return false;
		});

		/* 🔵 - Yearn Finance **************************************************
		** Prepare the return data. We fetched data from the relevant source and
		** filtered the elements we needed. Now we can try to group the data
		** together to have some correct complet data to work with.
		**********************************************************************/
		const	_vaults: TVault[] = [];
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
			const	_strategies = [];
			for (const strat of vault.strategies) {
				const	stratMeta = strategies.find((s: any): boolean => s.addresses.includes(strat.address));
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

			vault.categories = ['Simple Saver'];
			vault.chainID = chainID;
			if (chainID === 1 || chainID === 1337) {
				if (toAddress(vault.address) === toAddress('0xdA816459F1AB5631232FE5e97a05BBBb94970c95')) //DAI
					vault.categories = ['Simple Saver', 'USD Stable'];
				if (toAddress(vault.address) === toAddress('0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE')) //usdc
					vault.categories = ['Simple Saver', 'USD Stable'];
				if (toAddress(vault.address) === toAddress('0x7Da96a3891Add058AdA2E826306D812C638D87a7')) //usdt
					vault.categories = ['Simple Saver', 'USD Stable'];
				if (toAddress(vault.address) === toAddress('0xdb25cA703181E7484a155DD612b06f57E12Be5F0')) //YFI
					vault.categories = ['Simple Saver', 'Blue Chip'];
				if (toAddress(vault.address) === toAddress('0xa258C4606Ca8206D8aA700cE2143D7db854D168c')) //ETH
					vault.categories = ['Simple Saver', 'Blue Chip'];
				if (toAddress(vault.address) === toAddress('0xA696a63cc78DfFa1a63E9E50587C197387FF6C7E')) //BTC
					vault.categories = ['Simple Saver', 'Blue Chip'];
			} else if (chainID === 250) {
				if (toAddress(vault.address) === toAddress('0x0DEC85e74A92c52b7F708c4B10207D9560CEFaf0')) //yvWFTM
					vault.categories = ['Simple Saver', 'Blue Chip'];
				if (toAddress(vault.address) === toAddress('0xEF0210eB96c7EB36AF8ed1c20306462764935607')) //yvUSDC
					vault.categories = ['Simple Saver', 'USD Stable'];
				if (toAddress(vault.address) === toAddress('0x637eC617c86D24E421328e6CAEa1d92114892439')) //yvDAI
					vault.categories = ['Simple Saver', 'USD Stable'];
				if (toAddress(vault.address) === toAddress('0x148c05caf1Bb09B5670f00D511718f733C54bC4c')) //yvUSDT
					vault.categories = ['Simple Saver', 'USD Stable'];
				if (toAddress(vault.address) === toAddress('0xCe2Fc0bDc18BD6a4d9A725791A3DEe33F3a23BB7')) //yvWETH
					vault.categories = ['Simple Saver', 'Blue Chip'];
				if (toAddress(vault.address) === toAddress('0xd817A100AB8A29fE3DBd925c2EB489D67F758DA9')) //yvWBTC
					vault.categories = ['Simple Saver', 'Blue Chip'];
				if (toAddress(vault.address) === toAddress('0x2C850cceD00ce2b14AA9D658b7Cad5dF659493Db')) //yvYFI
					vault.categories = ['Simple Saver', 'Blue Chip'];
			}
			_vaults.push(vault);
		}

		performBatchedUpdates((): void => {
			set_vaults(_vaults);
			set_nonce((n): number => n + 1);
			set_defaultCategories([...new Set(_vaults.map((vault): string[] => vault.categories).flat())]);
			NProgress.done();
		});
	}, [chainID, networks]);

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


export const useYearn = (): TYearnContext => useContext(YearnContext);
export default useYearn;
