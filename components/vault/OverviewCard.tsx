import	React, {ReactElement}										from	'react';
import	Image														from	'next/image';
import	{ethers}													from	'ethers';
import	{AddressWithActions, Card}									from	'@yearn-finance/web-lib/components';
import	{parseMarkdown, toAddress, format, performBatchedUpdates}	from	'@yearn-finance/web-lib/utils';
import	{useWeb3}													from	'@yearn-finance/web-lib/contexts';
import	useWallet													from	'contexts/useWallet';
import	type {TVault}												from	'contexts/useYearn.d';

/* 🔵 - Yearn Finance **********************************************************
** The OverviewCard component is a simple card used to display some relevant
** info about the vault. Name, address, shares and balances, description and 
** price are the current one, but we could imagine any cool info there.
******************************************************************************/
function	OverviewCard({currentVault, address}: {currentVault?: TVault, address: string}): ReactElement {
	const	{isActive} = useWeb3();
	const	{balances, prices, useWalletNonce} = useWallet();
	const	[shareOfVault, set_shareOfVault] = React.useState(ethers.constants.Zero);
	const	[balanceOfToken, set_balanceOfToken] = React.useState(ethers.constants.Zero);
	const	[priceOfVault, set_priceOfVault] = React.useState(ethers.constants.One);

	/* 🔵 - Yearn Finance ******************************************************
	** This useEffect trigget the set and reset of the local state. We grab the
	** user's wallet information to get all the relevant data (share, balance).
	** Please note the use of useWalletNonce to refresh data. See react deep
	** effect for more info.
	**************************************************************************/
	React.useEffect((): (() => void) => {
		performBatchedUpdates((): void => {
			set_shareOfVault(format.BN(balances[toAddress(address)]?.raw));
			set_balanceOfToken(format.BN(balances[toAddress(currentVault?.token?.address)]?.raw));
			set_priceOfVault(format.BN(prices[toAddress(address)]?.raw));
		});
		return (): void => {
			performBatchedUpdates((): void => {
				set_shareOfVault(ethers.constants.Zero);
				set_balanceOfToken(ethers.constants.Zero);
				set_priceOfVault(ethers.constants.One);
			});
		};
	}, [balances, isActive, prices, address, currentVault?.token?.address, useWalletNonce]);


	/* 🔵 - Yearn Finance ******************************************************
	** Based on the amount inputed and the prices of vault, determine the
	** expected shares to receive if the user deposits `amount` tokens.
	** This function is set in a callback for performance reasons.
	**************************************************************************/
	const	getShareValue = React.useCallback((): string => {
		const	_amount = format.toNormalizedValue(shareOfVault, currentVault?.decimals || 18);
		const	_price = format.toNormalizedValue(priceOfVault, currentVault?.decimals || 18);
		const	_value = (_amount * _price);
		if (Number(_value) === 0) {
			return ('-');
		}
		return (`${format.amount(_value)} $`);
	}, [shareOfVault, currentVault?.decimals, priceOfVault]);

	/* 🔵 - Yearn Finance ******************************************************
	** Main render of the page.
	**************************************************************************/
	return (
		<Card className={'col-span-1 md:col-span-3'}>
			<div className={'flex flex-row items-start mb-6 space-x-6'}>
				{currentVault?.token?.icon ? <Image
					src={currentVault?.token?.icon || ''}
					width={80}
					height={80}
					className={'min-w-[80px]'} /> : <div className={'w-[80px] h-[80px] rounded-full bg-neutral-0'} />}
				<div>
					<h2 className={'-mt-1 -mb-2 text-xl font-bold md:text-5xl text-neutral-700'}>
						{currentVault?.name || ''}
					</h2>
					<AddressWithActions
						className={'text-sm font-normal '}
						address={toAddress(address)} />
				</div>

			</div>
			<div className={'mb-4 space-y-2'}>
				<b>{'About'}</b>
				<p
					className={'text-neutral-700/70'}
					dangerouslySetInnerHTML={{__html: parseMarkdown(currentVault?.description || '')}} />
			</div>
			<div className={'grid grid-cols-2 gap-2 md:grid-cols-4'}>
				<div>
					<p className={'text-xs text-neutral-700/50'}>{'Your token balance'}</p>
					<b className={'text-lg'}>
						{balanceOfToken.isZero() ? '-' : format.bigNumberAsAmount(
							balanceOfToken,
							currentVault?.decimals,
							2
						)}
					</b>
				</div>
				<div>
					<p className={'text-xs text-neutral-700/50'}>{'Your vault shares'}</p>
					<b className={'text-lg'}>
						{shareOfVault.isZero() ? '-' : format.bigNumberAsAmount(
							shareOfVault,
							currentVault?.decimals,
							2
						)}
					</b>
				</div>
				<div>
					<p className={'text-xs text-neutral-700/50'}>{'Your shares value'}</p>
					<b className={'text-lg'}>
						{getShareValue()}
					</b>
				</div>
			</div>
		</Card>
	);
}

export default OverviewCard;