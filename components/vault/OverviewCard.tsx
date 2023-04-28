import	React, {ReactElement, ReactNode}										from	'react';
import	Image														from	'next/image';
import	{ethers}													from	'ethers';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {formatToNormalizedValue} from '@yearn-finance/web-lib/utils/format';
import {BN, bigNumberAsAmount} from '@yearn-finance/web-lib/utils/format.bigNumber';
import	useWallet													from	'contexts/useWallet';
import	type {TVault}												from	'contexts/useYearn.d';
import {parseMarkdown} from '@yearn-finance/web-lib/utils/helpers';

// TODO
function Card({children, className, padding}: {children: ReactNode; className?: string; padding?: string;}): ReactElement {
	return (
		<div className={className} style={{padding}}>
			{children}
		</div>
	);
}

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
			set_shareOfVault(BN(balances[toAddress(address)]?.raw));
			set_balanceOfToken(BN(balances[toAddress(currentVault?.token?.address)]?.raw));
			set_priceOfVault(BN(prices[toAddress(address)]?.raw));
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
		const	_amount =formatToNormalizedValue(shareOfVault, currentVault?.decimals || 18);
		const	_price =formatToNormalizedValue(priceOfVault, currentVault?.decimals || 18);
		const	_value = (_amount * _price);
		if (Number(_value) === 0) {
			return ('-');
		}
		return (`${formatAmount(_value)} $`);
	}, [shareOfVault, currentVault?.decimals, priceOfVault]);

	/* 🔵 - Yearn Finance ******************************************************
	** Main render of the page.
	**************************************************************************/
	return (
		<Card className={'col-span-1 md:col-span-3'}>
			<div className={'mb-6 flex flex-row items-start space-x-6'}>
				{currentVault?.token?.icon ? <Image
					src={currentVault?.token?.icon || ''}
					width={80}
					height={80}
					className={'min-w-[80px]'} /> : <div className={'bg-neutral-0 h-[80px] w-[80px] rounded-full'} />}
				<div>
					<h2 className={'-mt-1 -mb-2 text-xl font-bold text-neutral-700 md:text-5xl'}>
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
						{balanceOfToken.isZero() ? '-' : bigNumberAsAmount(
							balanceOfToken,
							currentVault?.decimals,
							2
						)}
					</b>
				</div>
				<div>
					<p className={'text-xs text-neutral-700/50'}>{'Your vault shares'}</p>
					<b className={'text-lg'}>
						{shareOfVault.isZero() ? '-' : bigNumberAsAmount(
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