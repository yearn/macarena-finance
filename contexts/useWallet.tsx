import	React, {ReactElement, useContext, createContext}		from	'react';
import	{Contract}												from	'ethcall';
import	{useSettings, useWeb3}									from	'@yearn-finance/web-lib/contexts';
import	{format, toAddress, providers, performBatchedUpdates}	from	'@yearn-finance/web-lib/utils';
import	VAULT_V2_ABI											from	'utils/abi/vault.v2.abi';
import	ERC20_ABI												from	'utils/abi/erc20.abi';
import	LENS_ABI												from	'utils/abi/lens.abi';
import type * as TWalletTypes									from	'contexts/useWallet.d';
import type {TVault}											from	'contexts/useYearn.d';

const	defaultProps = {
	balances: {},
	allowances: {},
	prices: {},
	useWalletNonce: 0,
	updateVaultData: async (): Promise<void> => undefined
};

/* 🔵 - Yearn Finance **********************************************************
** This context controls most of the user's wallet data we may need to
** interact with our app, aka mostly the balances, the allowances and the token
** prices.
** All theses data are fetched on chain via a multicall, using the lens contract
** for the prices, and it populates an object {[token.address]: element} for an
** easy access through our app.
** On disconnect or network change, data are re-fetched and replaced.
******************************************************************************/
const	WalletContext = createContext<TWalletTypes.TWalletContext>(defaultProps);
export const WalletContextApp = ({children, vaults}: {children: ReactElement, vaults: TVault[]}): ReactElement => {
	const	{provider, isDisconnected, address, chainID} = useWeb3();
	const	{networks} = useSettings();
	const	[balances, set_balances] = React.useState<TWalletTypes.TBalances>(defaultProps.balances);
	const	[allowances, set_allowances] = React.useState<TWalletTypes.TBalances>(defaultProps.allowances);
	const	[prices, set_prices] = React.useState<TWalletTypes.TPrices>(defaultProps.prices);
	const	[nonce, set_nonce] = React.useState(0);

	/* 🔵 - Yearn Finance ******************************************************
	**	On disconnect, status
	***************************************************************************/
	React.useEffect((): void => {
		if (isDisconnected) {
			performBatchedUpdates((): void => {
				set_balances(defaultProps.balances);
				set_allowances(defaultProps.allowances);
			});
		}
	}, [isDisconnected]);

	/* 🔵 - Yearn Finance ******************************************************
	**	Once the wallet is connected and a provider is available, we can fetch
	**	the informations for a specific wallet.
	***************************************************************************/
	const getWalletStatus = React.useCallback(async (): Promise<void> => {
		if (vaults.length === 0) {
			return;
		}

		const	currentProvider = provider || providers.getProvider(chainID);
		const	ethcallProvider = await providers.newEthCallProvider(currentProvider);
		const	userAddress = address || '0x0000000000000000010000000000000000000000'; //using this address as dummy
		const	_vaults = vaults.filter((v): boolean => v.chainID === chainID || (v.chainID === 1 && chainID === 1337));
		const	calls = [];

		for (const vault of _vaults) {
			const	vaultContract = new Contract(vault.address, VAULT_V2_ABI);
			const	underlyingTokenContract = new Contract(vault.token.address, ERC20_ABI);
			const	lensPriceContract = new Contract(networks[chainID === 1337 ? 1 : chainID || 1].lensAddress, LENS_ABI);

			calls.push(...[
				vaultContract.balanceOf(userAddress),
				vaultContract.pricePerShare(),
				underlyingTokenContract.balanceOf(userAddress),
				underlyingTokenContract.allowance(
					userAddress,
					networks[chainID === 1337 ? 1 : chainID || 1].partnerContractAddress
				),
				lensPriceContract.getPriceUsdcRecommended(vault.token.address)
			]);
		}

		const	results = await ethcallProvider.tryAll(calls) as never[];
		const	_balances: TWalletTypes.TBalances = {};
		const	_allowances: TWalletTypes.TAllowances = {};
		const	_prices: TWalletTypes.TPrices = {};
		let		rIndex = 0;
		for (const vault of _vaults) {
			const	vaultBalance = results[rIndex++];
			const	vaultPricePerShare = results[rIndex++];
			const	tokenBalance = results[rIndex++];
			const	tokenAllowance = results[rIndex++];
			const	tokenPrice = results[rIndex++];

			_balances[toAddress(vault.address)] = {
				raw: vaultBalance,
				normalized: format.toNormalizedValue(vaultBalance, vault.decimals)
			};
			_balances[toAddress(vault.token.address)] = {
				raw: tokenBalance,
				normalized: format.toNormalizedValue(tokenBalance, vault.token.decimals)
			};
			_allowances[toAddress(vault.token.address)] = {
				raw: tokenAllowance,
				normalized: format.toNormalizedValue(tokenAllowance, vault.token.decimals)
			};
			_prices[toAddress(vault.address)] = {
				raw: vaultPricePerShare,
				normalized: format.toNormalizedValue(vaultPricePerShare, vault.decimals)
			};
			_prices[toAddress(vault.token.address)] = {
				raw: tokenPrice,
				normalized: format.toNormalizedValue(tokenPrice, 6)
			};
		}

		performBatchedUpdates((): void => {
			set_balances(_balances);
			set_allowances(_allowances);
			set_prices(_prices);
			set_nonce((n: number): number => n + 1);
		});
	}, [provider, address, vaults, chainID, networks]);
	React.useEffect((): void => {
		getWalletStatus();
	}, [getWalletStatus]);

	const updateVaultData = React.useCallback(async (vault: TVault): Promise<void> => {
		if (!address || !provider) {
			return;
		}

		const	currentProvider = provider || providers.getProvider(chainID);
		const	ethcallProvider = await providers.newEthCallProvider(currentProvider);
		const	userAddress = address;
		const	calls = [];
		const	vaultContract = new Contract(vault.address, VAULT_V2_ABI);
		const	underlyingTokenContract = new Contract(vault.token.address, ERC20_ABI);
		const	lensPriceContract = new Contract(networks[chainID === 1337 ? 1 : chainID || 1].lensAddress, LENS_ABI);

		calls.push(...[
			vaultContract.balanceOf(userAddress),
			vaultContract.pricePerShare(),
			underlyingTokenContract.balanceOf(userAddress),
			underlyingTokenContract.allowance(
				userAddress,
				networks[chainID === 1337 ? 1 : chainID || 1].partnerContractAddress
			),
			lensPriceContract.getPriceUsdcRecommended(vault.token.address)
		]);

		let		rIndex = 0;
		const	results = await ethcallProvider.tryAll(calls) as never[];
		const	_balances: TWalletTypes.TBalances = balances;
		const	_allowances: TWalletTypes.TAllowances = allowances;
		const	_prices: TWalletTypes.TPrices = prices;
		const	vaultBalance = results[rIndex++];
		const	vaultPricePerShare = results[rIndex++];
		const	tokenBalance = results[rIndex++];
		const	tokenAllowance = results[rIndex++];
		const	tokenPrice = results[rIndex++];

		_balances[toAddress(vault.address)] = {
			raw: vaultBalance,
			normalized: format.toNormalizedValue(vaultBalance, vault.decimals)
		};
		_balances[toAddress(vault.token.address)] = {
			raw: tokenBalance,
			normalized: format.toNormalizedValue(tokenBalance, vault.token.decimals)
		};
		_allowances[toAddress(vault.token.address)] = {
			raw: tokenAllowance,
			normalized: format.toNormalizedValue(tokenAllowance, vault.token.decimals)
		};
		_prices[toAddress(vault.address)] = {
			raw: vaultPricePerShare,
			normalized: format.toNormalizedValue(vaultPricePerShare, vault.decimals)
		};
		_prices[toAddress(vault.token.address)] = {
			raw: tokenPrice,
			normalized: format.toNormalizedValue(tokenPrice, 6)
		};

		performBatchedUpdates((): void => {
			set_balances(_balances);
			set_allowances(_allowances);
			set_prices(_prices);
			set_nonce((n: number): number => n + 1);
		});
	}, [address, provider, chainID, balances, allowances, prices, networks]);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<WalletContext.Provider
			value={{
				balances,
				allowances,
				prices,
				updateVaultData,
				useWalletNonce: nonce
			}}>
			{children}
		</WalletContext.Provider>
	);
};


export const useWallet = (): TWalletTypes.TWalletContext => useContext(WalletContext);
export default useWallet;
