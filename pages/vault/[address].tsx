import	React, {ReactElement}				from	'react';
import	Link								from	'next/link';
import	axios								from	'axios';
import	{AddressWithActions, Card}			from	'@yearn-finance/web-lib/components';
import	{parseMarkdown, toAddress}			from	'@yearn-finance/web-lib/utils';
import	{Chevron}							from	'@yearn-finance/web-lib/icons';
import	useYearn							from	'contexts/useYearn';
import	DepositCard							from	'components/vault/DepositCard';
import	OverviewCard						from	'components/vault/OverviewCard';
import	ChartCard							from	'components/vault/ChartCard';
import type {TVault}						from	'contexts/useYearn.d';

function	Vault({address, tokenAddress, description, icon, name, decimals, chainID}: TVault & {
	chainID: number,
	tokenAddress: string
}): ReactElement {
	const	{vaults} = useYearn();
	const	[currentVault, set_currentVault] = React.useState<TVault | undefined>(vaults.find((vault): boolean => toAddress(vault.address) === address));

	React.useEffect((): void => {
		set_currentVault(vaults.find((vault): boolean => toAddress(vault.address) === toAddress(address)));
	}, [vaults, address]);


	/* 🔵 - Yearn Finance ******************************************************
	** Main render of the page.
	**************************************************************************/
	return (
		<div className={'z-0 w-full'}>
			<Link href={'/'}>
				<div className={'flex flex-row items-center mb-4 space-x-2  opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer'}>
					<Chevron className={'w-4 h-4'} />
					<p>{'Back'}</p>
				</div>
			</Link>
			<div className={'grid grid-cols-1 gap-4 md:grid-cols-5'}>
				<OverviewCard
					currentVault={{
						address,
						name,
						description,
						decimals,
						token: {
							icon,
							address: tokenAddress
						}
					}} />
				<ChartCard
					address={address}
					price={currentVault?.tvl?.price || 0}
					chainID={chainID} />
			</div>
			<div className={'grid grid-cols-1 gap-4 mt-4 md:grid-cols-5'}>
				<div className={'col-span-1 md:col-span-3'}>
					<Card>
						<div className={'mb-4'}>
							<b>{'Strategies'}</b>
						</div>
						{currentVault?.strategies && (
							<section aria-label={'strategies'} className={'space-y-4'}>
								{currentVault.strategies.map((strategy: any): ReactElement => (
									<div key={strategy.address} className={'py-2 px-4 border border-neutral-100 rounded-default'}>
										<b className={'font-mono text-typo-primary'}>{strategy.display_name || strategy.name}</b>
										<AddressWithActions
											address={strategy.address}
											className={'text-sm font-normal'} />
										<p
											className={'mt-4 text-xs line-clamp-4'}
											dangerouslySetInnerHTML={{__html: parseMarkdown((strategy?.description || '').replace(/{{token}}/g, currentVault.token.symbol) || '')}} />
									
									</div>
								))}
							</section>
						)}
					</Card>
				</div>
				<div className={'col-span-1 md:col-span-2'}>
					<Card className={'overflow-hidden w-full max-w-full'} padding={'none'}>
						{currentVault && <DepositCard currentVault={currentVault} />}
					</Card>
				</div>
			</div>
		</div>
	);
}

export async function getStaticPaths(): Promise<unknown> {
	const	[{data: dataMainnet}, {data: dataFtm}] = await Promise.all([
		axios.get('https://api.yearn.finance/v1/chains/1/vaults/all'),
		axios.get('https://api.yearn.finance/v1/chains/250/vaults/all')
	]);
	const	paths = [...dataMainnet, ...dataFtm].map((vault: {address: string}): unknown => ({
		params: {address: vault.address}
	}));

	return ({paths: paths, fallback: false});
}

export async function getStaticProps({params}: {params: {address: string}}): Promise<unknown> {
	const	address = toAddress(params.address);
	const	[_vaultsMainnet, _vaultsFtm] = await Promise.all([
		axios.get('https://api.yearn.finance/v1/chains/1/vaults/all'),
		axios.get('https://api.yearn.finance/v1/chains/250/vaults/all')
	]);

	let		chainID = 1;
	let		vault = _vaultsMainnet.data.find((vault: {address: string}): boolean => toAddress(vault.address) === toAddress(address));
	if (!vault) {
		vault = _vaultsFtm.data.find((vault: {address: string}): boolean => toAddress(vault.address) === toAddress(address));
		if (vault) {
			chainID = 250;
		}
	}

	const	[_token] = await Promise.allSettled([
		axios.get(`https://meta.yearn.finance/api/${chainID}/tokens/${vault.token.address}`)
	]);
	if (_token.status === 'rejected') {
		console.error(`failed to fetch vaults: ${_token.reason}`);
		return {props: {
			address,
			icon: vault.token.icon,
			name: vault.display_name || vault.name,
			decimals: vault.decimals,
			tokenSymbol: vault.token.symbol,
			tokenAddress: vault.token.address,
			description: '',
			chainID
		}};
	}

	return {props: {
		address,
		icon: vault.token.icon,
		name: vault.display_name || vault.name,
		decimals: vault.decimals,
		tokenSymbol: vault.token.symbol,
		tokenAddress: vault.token.address,
		description: (_token?.value.data?.description || '').replace(/{{token}}/g, vault.token.symbol),
		chainID
	}};
}

export default Vault;
