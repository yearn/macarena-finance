import	React, {ReactElement}	from	'react';
import	Image					from	'next/image';
import	Link					from	'next/link';
import	{motion}				from	'framer-motion';
import	useYearn				from	'contexts/useYearn';
import	Filters					from	'components/Filters';
import {Card} 					from 	'components/common/Card';
import {useChainID}				from	'@yearn-finance/web-lib/hooks/useChainID';
import {Button} 				from 	'@yearn-finance/web-lib/components/Button';
import {formatAmount} 			from 	'@yearn-finance/web-lib/utils/format.number';
import performBatchedUpdates 	from 	'@yearn-finance/web-lib/utils/performBatchedUpdates';

import type {TVault}			from	'contexts/useYearn.d';

function	VaultCard({currentVault}: {currentVault: TVault}): ReactElement {
	const	{safeChainID} = useChainID();
	
	const slashMotion = {
		rest: {x: -8, y: -8},
		hover: {x: -4, y: -4}
	};

	return (
		<div className={'w-full'}>
			<Link href={`/${safeChainID}/vault/${currentVault.address}`} passHref>
				<a>
					<Card className={'yearn--card col-span-1 md:col-span-3'} padding={'none'}>
						<motion.div initial={'rest'} whileHover={'hover'} animate={'rest'} className={'cursor-pointer'}>
							<motion.div
								variants={slashMotion}
								className={'macarena--vaultCard flex flex-col items-start justify-between p-6 pb-4'}>
								<div className={'flex w-full flex-row items-start justify-between'}>
									<div className={'min-h-[32px] min-w-[32px] md:min-h-[80px] md:min-w-[80px]'}>
										<Image
											src={currentVault.token.icon}
											width={80}
											height={80} />
									</div>
									<div className={'flex flex-col text-right'}>
										<p className={'text-xs text-neutral-700'}>{'APY'}</p>
										<b className={'text-4xl'}>{Number((currentVault.apy.net_apy * 100).toFixed(2)) === 0 ? '-' : `${formatAmount(currentVault.apy.net_apy * 100, 2, 2)}%`}</b>
									</div>
								</div>
								<div>
									<h2 className={'mt-1 text-lg font-bold text-neutral-700 md:text-5xl'}>
										{currentVault.token.display_name || currentVault.token.name}
									</h2>
								</div>
							</motion.div>

							<div className={'space-y-6 p-4 md:p-6'}>
								<div>
									<p className={'text-sm text-neutral-700'}>{'TVL'}</p>
									<b className={'text-4xl'}>{`$${formatAmount(currentVault.tvl.tvl / 1000_000, 2, 2)}m`}</b>
								</div>

								<div>
									<b className={'text-sm text-neutral-700'}>{'Annualized Growth'}</b>
									<div className={'mt-2 grid grid-cols-3 gap-4'}>
										<div className={'flex flex-col'}>
											<p className={'text-xs text-neutral-700/70'}>{'Last 7 days'}</p>
											<b className={'text-neutral-700'}>{`${formatAmount(currentVault.apy.points.week_ago * 100, 2, 2)}%`}</b>
										</div>
										<div className={'flex flex-col'}>
											<p className={'text-xs text-neutral-700/70'}>{'Last 30 days'}</p>
											<b className={'text-neutral-700'}>{`${formatAmount(currentVault.apy.points.month_ago * 100, 2, 2)}%`}</b>
										</div>
										<div className={'flex flex-col'}>
											<p className={'text-xs text-neutral-700/70'}>{'All Time'}</p>
											<b className={'text-neutral-700'}>{`${formatAmount(currentVault.apy.points.inception * 100, 2, 2)}%`}</b>
										</div>
									</div>
								</div>

								<div>
									<Button className={'min-w-[136px]'}>
										{'Jump in!'}
									</Button>
								</div>
							</div>
						</motion.div>
					</Card>
				</a>
			</Link>
		</div>
	);
}

function	Vaults({vaults}: {vaults: TVault[]}): ReactElement {
	return (
		<div className={'grid grid-cols-1 gap-6 md:grid-cols-3'}>
			{
				vaults.map((currentVault: TVault): ReactElement => {
					return (
						<VaultCard key={currentVault.address} currentVault={currentVault} />
					);
				})
			}
		</div>
	);
}

function	Index(): ReactElement {
	const	{vaults, nonce: dataNonce, defaultCategories} = useYearn();
	const	[filteredVaults, set_filteredVaults] = React.useState<TVault[]>([]);
	const	[selectedCategory, set_selectedCategory] = React.useState('');

	/* 🔵 - Yearn Finance ******************************************************
	** This effect is triggered every time the vault list or the search term is
	** changed, or the delta selector is updated. It filters the pairs based on
	** that to only work with them.
	**************************************************************************/
	React.useEffect((): void => {
		let		_filteredVaults = [...vaults];
		if (selectedCategory !== '')
			_filteredVaults = _filteredVaults.filter((vault): boolean => vault.categories.includes(selectedCategory));
		_filteredVaults = _filteredVaults.sort((a, b): number => b.apy.net_apy - a.apy.net_apy);
		performBatchedUpdates((): void => {
			set_filteredVaults(_filteredVaults);
		});
	}, [dataNonce, vaults, selectedCategory]);

	/* 🔵 - Yearn Finance ******************************************************
	** Main render of the page.
	**************************************************************************/
	return (
		<div className={'z-0 w-full pb-10 md:pb-20'}>
			<Filters
				currentCategory={selectedCategory}
				availableCategories={defaultCategories}
				onSelect={(category: string): void => set_selectedCategory(category)} />

			<Vaults vaults={filteredVaults} />
		</div>
	);
}

export default Index;
