import	React, {ReactElement, ReactNode}	from	'react';
import	Link								from	'next/link';
import	{useRouter}							from	'next/router';
import Chevron 								from 	'@yearn-finance/web-lib/icons/IconChevron';
import {parseMarkdown} 						from 	'@yearn-finance/web-lib/utils/helpers';
import	useYearn							from	'contexts/useYearn';
import	DepositCard							from	'components/vault/DepositCard';
import	OverviewCard						from	'components/vault/OverviewCard';
import	ChartCard							from	'components/vault/ChartCard';
import type {TVault}						from	'contexts/useYearn.d';
import useWeb3 								from	'@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} 							from	'@yearn-finance/web-lib/utils/address';

// TODO
function Card({children, className, padding}: {children: ReactNode; className?: string; padding?: string;}): ReactElement {
	return (
		<div className={className} style={{padding}}>
			{children}
		</div>
	);
}

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
				<div className={'mb-4 flex cursor-pointer flex-row items-center  space-x-2 opacity-40 transition-opacity duration-300 hover:opacity-100'}>
					<Chevron className={'h-4 w-4'} />
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
			<div className={'mt-4 grid grid-cols-1 gap-4 md:grid-cols-5'}>
				<div className={'col-span-1 md:col-span-3'}>
					<Card>
						<div className={'mb-4'}>
							<b>{'Strategies'}</b>
						</div>
						{currentVault?.strategies && (
							<section aria-label={'strategies'} className={'space-y-4'}>
								{currentVault.strategies.map((strategy: any): ReactElement => (
									<div key={strategy.address} className={'rounded-default border border-neutral-100 py-2 px-4'}>
										<b className={'text-typo-primary font-mono'}>{strategy.display_name || strategy.name}</b>
										<AddressWithActions
											address={strategy.address}
											className={'text-sm font-normal'} />
										<p
											className={'line-clamp-4 mt-4 text-xs'}
											dangerouslySetInnerHTML={{__html: parseMarkdown((strategy?.description || '').replace(/{{token}}/g, currentVault.token.symbol) || '')}} />
									
									</div>
								))}
							</section>
						)}
					</Card>
				</div>
				<div className={'col-span-1 md:col-span-2'}>
					<Card className={'w-full max-w-full overflow-hidden'} padding={'none'}>
						{currentVault && <DepositCard currentVault={currentVault} />}
					</Card>
				</div>
			</div>
		</div>
	);
}

export default Vault;
