import	React, {ReactElement}				from	'react';
import	Link								from	'next/link';
import	{useRouter}							from	'next/router';
import	{AddressWithActions, Card}			from	'@yearn-finance/web-lib/components';
import	{parseMarkdown, toAddress}			from	'@yearn-finance/web-lib/utils';
import	{Chevron}							from	'@yearn-finance/web-lib/icons';
import	{useWeb3}							from	'@yearn-finance/web-lib/contexts';
import	useYearn							from	'contexts/useYearn';
import	DepositCard							from	'components/vault/DepositCard';
import	OverviewCard						from	'components/vault/OverviewCard';
import	ChartCard							from	'components/vault/ChartCard';
import type {TVault}						from	'contexts/useYearn.d';

function	Vault(): ReactElement {
	const	router = useRouter();
	const	{vaults} = useYearn();
	const	{chainID} = useWeb3();
	const	[currentVault, set_currentVault] = React.useState<TVault | undefined>(vaults.find((vault): boolean => toAddress(vault.address) === router.query.address));

	React.useEffect((): void => {
		if (router.query.address) {
			const	_currentVault = vaults.find((vault): boolean => toAddress(vault.address) === toAddress(router.query.address as string));
			set_currentVault(_currentVault);
		}
	}, [vaults, router.query.address]);

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
					address={router.query.address as string}
					currentVault={currentVault} />
				<ChartCard
					address={router.query.address as string}
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

export default Vault;
