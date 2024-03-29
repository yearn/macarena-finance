import	React, {ReactElement, ReactNode}	from	'react';	
import	Image								from	'next/image';
import	{ethers}							from	'ethers';
import {formatAmount} 						from 	'@yearn-finance/web-lib/utils/format.number';
import {useWeb3} 							from 	'@yearn-finance/web-lib/contexts/useWeb3';
import performBatchedUpdates 				from 	'@yearn-finance/web-lib/utils/performBatchedUpdates';
import {toAddress} 							from 	'@yearn-finance/web-lib/utils/address';
import {toSafeAmount}						from 	'@yearn-finance/web-lib/utils/format';
import {BN, formatUnits,
	toNormalizedAmount, toNormalizedValue} 	from 	'@yearn-finance/web-lib/utils/format.bigNumber';
import {Transaction, defaultTxStatus} 		from 	'@yearn-finance/web-lib/utils/web3/transaction';
import useSettings 							from 	'@yearn-finance/web-lib/contexts/useSettings';
import	Line								from	'components/icons/Line';
import	{approveERC20}						from	'utils/actions/approveToken';
import	{depositToken}						from	'utils/actions/depositToken';
import	{withdrawShare}						from	'utils/actions/withdrawShare';
import	useWallet							from	'contexts/useWallet';
import {Input}  							from 	'components/common/Input';
import {Button} 							from 	'@yearn-finance/web-lib/components/Button';

import type {TVault}						from	'contexts/useYearn.d';

/* 🔵 - Yearn Finance **********************************************************
** The DepositCard component handle the whole logic to set the value to deposit
** or withdraw and perform the actual web3 action. It will use the user's info
** (provider, address) from the web-lib, it's wallet info from the useWallet
** context and will init a bunch of state variables to controle the flow. 
** The Transaction flow is used to perform the transactions.
******************************************************************************/
function DepositCard({currentVault}: {currentVault: TVault}): ReactElement{
	const	{chainID, isActive, address, provider} = useWeb3();
	const	{balances, prices, allowances, updateVaultData, useWalletNonce} = useWallet();
	const	{networks} = useSettings();
	const	[actionType, set_actionType] = React.useState('deposit');
	const	[amount, set_amount] = React.useState('');
	const	[shareOfVault, set_shareOfVault] = React.useState(ethers.constants.Zero);
	const	[balanceOfToken, set_balanceOfToken] = React.useState(ethers.constants.Zero);
	const	[allowanceForToken, set_allowanceForToken] = React.useState(ethers.constants.Zero);
	const	[priceOfToken, set_priceOfToken] = React.useState(ethers.constants.Zero);
	const	[priceOfVault, set_priceOfVault] = React.useState(ethers.constants.One);
	const	[txStatusApprove, set_txStatusApprove] = React.useState(defaultTxStatus);
	const	[txStatusDeposit, set_txStatusDeposit] = React.useState(defaultTxStatus);
	const	[txStatusWithdraw, set_txStatusWithdraw] = React.useState(defaultTxStatus);

	/* 🔵 - Yearn Finance ******************************************************
	** This useEffect trigget the set and reset of the local state. A simple
	** logic is setup here:
	** - if no vault is set, we reset all the states to the initial values. The
	** same happens once the component is unmounted wia the return callback.
	** - if the vault is set, we grab the user's wallet information to get all
	** the relevant data (share, balance, allowance, token price, vault price)
	** and depending on the deposit or withdraw action, we set the initial
	** input value to what we need (balance of deposit, 0 for withdraw).
	** Please note the use of useWalletNonce to refresh data. See react deep
	** effect for more info.
	**************************************************************************/
	React.useEffect((): void => {
		if (currentVault) {
			performBatchedUpdates((): void => {
				set_shareOfVault(BN(balances[toAddress(currentVault.address)]?.raw));
				set_balanceOfToken(BN(balances[toAddress(currentVault.token.address)]?.raw));
				set_allowanceForToken(BN(allowances[toAddress(currentVault.token.address)]?.raw));
				if (actionType === 'deposit') {
					set_amount((previousAmount): string => (
						previousAmount === ''
							? (balances[toAddress(currentVault.token.address)]?.normalized || '').toString()
							: previousAmount
					));
				} else {
					set_amount((previousAmount): string => (
						previousAmount === ''
							? (balances[toAddress(currentVault.address)]?.normalized || '').toString()
							: previousAmount
					));
				}
				set_priceOfToken(BN(prices[toAddress(currentVault.token.address)]?.raw));
				set_priceOfVault(BN(prices[toAddress(currentVault.address)]?.raw));
			});
		} else {
			performBatchedUpdates((): void => {
				set_shareOfVault(ethers.constants.Zero);
				set_balanceOfToken(ethers.constants.Zero);
				set_allowanceForToken(ethers.constants.Zero);
				set_priceOfToken(ethers.constants.Zero);
				set_priceOfVault(ethers.constants.One);
				set_amount('');
			});
		}
	}, [currentVault, balances, address, isActive, prices, allowances, actionType, useWalletNonce]);

	/* 🔵 - Yearn Finance ******************************************************
	** Trigger an approve web3 action, simply trying to approve `amount` tokens
	** to be used by the Partner contract, in charge of depositing the tokens.
	** This approve can not be triggered if the wallet is not active
	** (not connected) or if the tx is still pending.
	** Additional checks are performed on the button side, using the `disabled`
	** html property.
	** On success, we update the vault info to get up-to-date data, as well as
	** the allowance.
	**************************************************************************/
	async function	onApprove(): Promise<void> {
		if (!isActive || txStatusApprove.pending)
			return;
		const	transaction = (
			new Transaction(provider, approveERC20, set_txStatusApprove).populate(
				currentVault.token.address,
				networks[chainID === 1337 ? 1 : chainID  || 1].partnerContractAddress,
				toSafeAmount(amount, balances[toAddress(currentVault.token.address)].raw)
			).onSuccess(async (): Promise<void> => {
				await updateVaultData(currentVault);
				set_allowanceForToken(allowances[toAddress(currentVault.token.address)].raw);
			})
		);

		await transaction.perform();
	}

	/* 🔵 - Yearn Finance ******************************************************
	** Trigger a deposit web3 action, simply trying to deposit `amount` tokens
	** via the Partner Contract, to the selected vault.
	** This action can not be triggered if the wallet is not active
	** (not connected) or if the tx is still pending.
	** Additional checks are performed on the button side, using the `disabled`
	** html property.
	** On success, we update the vault info to get up-to-date data, as well as
	** the allowance, the balance of underlying and the share of vault.
	**************************************************************************/
	async function	onDeposit(): Promise<void> {
		if (!isActive || txStatusDeposit.pending)
			return;
		const	transaction = (
			new Transaction(provider, depositToken, set_txStatusDeposit).populate(
				networks[chainID === 1337 ? 1 : chainID  || 1].partnerContractAddress,
				currentVault.address,
				toSafeAmount(amount, balances[toAddress(currentVault.token.address)].raw)
			).onSuccess(async (): Promise<void> => {
				await updateVaultData(currentVault);
				performBatchedUpdates((): void => {
					set_shareOfVault(balances[toAddress(currentVault.address)].raw);
					set_balanceOfToken(balances[toAddress(currentVault.token.address)].raw);
					set_allowanceForToken(allowances[toAddress(currentVault.token.address)].raw);
				});
			})
		);

		const	isSuccessful = await transaction.perform();
		if (isSuccessful) {
			set_amount('');
		}
	}

	/* 🔵 - Yearn Finance ******************************************************
	** Trigger a withdraw web3 action, simply trying to withdraw `amount` shares
	** from the vault.
	** This action can not be triggered if the wallet is not active
	** (not connected) or if the tx is still pending.
	** Additional checks are performed on the button side, using the `disabled`
	** html property.
	** On success, we update the vault info to get up-to-date data, as well as
	** the balance of underlying and the share of vault.
	**************************************************************************/
	async function	onWithdraw(): Promise<void> {
		if (!isActive || txStatusDeposit.pending)
			return;
		const	transaction = (
			new Transaction(provider, withdrawShare, set_txStatusWithdraw).populate(
				currentVault.address,
				toSafeAmount(amount, balances[toAddress(currentVault.token.address)].raw)
			).onSuccess(async (): Promise<void> => {
				await updateVaultData(currentVault);
				performBatchedUpdates((): void => {
					set_shareOfVault(balances[toAddress(currentVault.address)].raw);
					set_balanceOfToken(balances[toAddress(currentVault.token.address)].raw);
				});
			})
		);

		const	isSuccessful = await transaction.perform();
		if (isSuccessful) {
			set_amount('');
		}
	}

	/* 🔵 - Yearn Finance ******************************************************
	** Based on the amount inputed and the prices of vault, determine the
	** expected tokens to receive if the user withdraw `amount` shares.
	** This function is set in a callback for performance reasons.
	**************************************************************************/
	const	getWithdrawReceiveTokens = React.useCallback((): number => {
		const	_amount = Number(amount || 0);
		const	_priceOfVault = toNormalizedValue(priceOfVault, currentVault?.decimals || 18);
		const	_price = _priceOfVault;
		if (_price === 0) {
			return 0;
		}
		return _amount * _price;
	}, [amount, priceOfVault, currentVault?.decimals]);
	
	/* 🔵 - Yearn Finance ******************************************************
	** Based on the getWithdrawReceiveTokens and the price of the underlying
	** token, calculate the value of the tokens to receive if the user withdraw
	** `amount` shares.
	** This function is set in a callback for performance reasons.
	**************************************************************************/
	const	getWithdrawReceiveValue = React.useCallback((): number => {
		const	_amount = getWithdrawReceiveTokens();
		const	_priceOfToken = toNormalizedValue(priceOfToken, 6);
		const	_price = _priceOfToken;
		if (_price === 0) {
			return 0;
		}
		return _amount * _price;
	}, [getWithdrawReceiveTokens, priceOfToken]);

	/* 🔵 - Yearn Finance ******************************************************
	** Based on the amount inputed and the prices of vault, determine the
	** expected shares to receive if the user deposits `amount` tokens.
	** This function is set in a callback for performance reasons.
	**************************************************************************/
	const	getDepositReceiveTokens = React.useCallback((): number => {
		const	_amount = Number(amount || 0);
		const	_priceOfVault = toNormalizedValue(priceOfVault, currentVault?.decimals || 18);
		if (_priceOfVault === 0) {
			return 0;
		}
		return _amount / _priceOfVault;
	}, [amount, priceOfVault, currentVault?.decimals]);
	
	/* 🔵 - Yearn Finance ******************************************************
	** Based on the getDepositReceiveTokens and the prices of the underlying
	** token and the vault, calculate the value of the shares to receive if the
	** user deposits `amount` tokens.
	** This function is set in a callback for performance reasons.
	**************************************************************************/
	const	getDepositReceiveValue = React.useCallback((): number => {
		const	_amount = getDepositReceiveTokens();
		const	_priceOfVault = toNormalizedValue(priceOfVault, currentVault?.decimals || 18);
		const	_priceOfToken = (toNormalizedValue(priceOfToken, 6));
		const	_price = _priceOfToken * _priceOfVault;
		if (_price === 0) {
			return 0;
		}
		return _amount * _price;
	}, [getDepositReceiveTokens, priceOfVault, currentVault?.decimals, priceOfToken]);

	/* 🔵 - Yearn Finance ******************************************************
	** Render for the input part for code splitting and readability
	**************************************************************************/
	function	renderInputField(): ReactNode {
		if (actionType === 'withdraw') {
			return (
				<div className={'mt-2 grid grid-cols-1 gap-2 md:grid-cols-1'}>
					<div>
						<div className={'ml-[-3px] flex flex-row space-x-2'}>
							<div className={'rounded-default min-w-24 md:min-w-32 flex aspect-square h-24 w-24 flex-col items-center justify-center bg-neutral-200 md:h-32 md:w-32'}>
								<div className={'h-8 w-8 md:h-12 md:w-12'}>
									<Image width={48} height={48} src={currentVault?.icon} />
								</div>
								<div className={'mt-2 px-1 text-center text-sm md:mt-4 md:px-2 md:text-base'}>
									<b>{currentVault?.symbol || ''}</b>
								</div>
							</div>
							<div className={'rounded-default flex h-24 w-full flex-col bg-neutral-200 py-2 px-4 md:h-32 md:py-4 md:px-6'}>
								<Input.BigNumber
									balance={toNormalizedAmount(shareOfVault, currentVault?.decimals)}
									price={toNormalizedValue(priceOfToken, 6) * toNormalizedValue(priceOfVault, currentVault?.decimals || 18)}
									value={amount}
									onSetValue={(s: string): void => set_amount(s)}
									maxValue={shareOfVault}
									decimals={currentVault?.decimals || 18} />
							</div>
						</div>
					</div>
					<div className={'my-4 md:mt-6'}>
						<b className={'text-neutral-700'}>{'Receive'}</b>
						<div className={'mt-1'}>
							<dl className={'w-full space-y-2'}>
								<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
									<dt className={'text-typo-secondary whitespace-nowrap pr-2'}>
										{currentVault?.token?.symbol}
									</dt>
									<dd className={'w-full font-bold'}>
										<div className={'absolute bottom-1.5 w-full'}>
											<Line className={'text-typo-secondary'}/>
										</div>
										<div className={'flex justify-end'}>
											<p className={'text-typo-secondary bg-neutral-0 z-10 pl-2 text-right'}>
												{formatAmount(getWithdrawReceiveTokens(), 2, 6, 24)}
											</p>
										</div>
									</dd>
								</div>

								<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
									<dt className={'text-typo-secondary whitespace-nowrap pr-2'}>{'USD Value'}</dt>
									<dd className={'w-full font-bold'}>
										<div className={'absolute bottom-1.5 w-full'}>
											<Line className={'text-typo-secondary'}/>
										</div>
										<div className={'flex justify-end'}>
											<p className={'text-typo-secondary bg-neutral-0 z-10 pl-2 text-right'}>
												{`$ ${formatAmount(getWithdrawReceiveValue(), 2, 2, 24)}`}
											</p>
										</div>
									</dd>
								</div>
							</dl>
						</div>
					</div>
				</div>
			);
		}
		return (
			<div className={'mt-2 grid grid-cols-1 gap-2 md:grid-cols-1'}>
				<div>
					<div className={'ml-[-3px] flex flex-row space-x-2'}>
						<div className={'rounded-default min-w-24 md:min-w-32 flex aspect-square h-24 w-24 flex-col items-center justify-center bg-neutral-200 md:h-32 md:w-32'}>
							<div className={'h-8 w-8 md:h-12 md:w-12'}>
								<Image width={48} height={48} src={currentVault?.token?.icon} />
							</div>
							<div className={'mt-2 px-1 text-center text-sm md:mt-4 md:px-2 md:text-base'}>
								<b>{currentVault?.token?.symbol || ''}</b>
							</div>
						</div>
						<div className={'rounded-default flex h-24 w-full flex-col overflow-hidden bg-neutral-200 py-2 px-4 md:h-32 md:py-4 md:px-6'}>
							<Input.BigNumber
								balance={toNormalizedAmount(balanceOfToken, currentVault?.decimals)}
								price={toNormalizedValue(priceOfToken, 6)}
								value={amount}
								onSetValue={(s: string): void => set_amount(s)}
								maxValue={balanceOfToken}
								decimals={currentVault?.decimals || 18} />
						</div>
					</div>
				</div>
				<div className={'my-4 md:mt-6'}>
					<b className={'text-neutral-700'}>{'Receive'}</b>
					<div className={'mt-1'}>
						<dl className={'w-full space-y-2'}>
							<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
								<dt className={'text-typo-secondary whitespace-nowrap pr-2'}>{currentVault.symbol}</dt>
								<dd className={'w-full font-bold'}>
									<div className={'absolute bottom-1.5 w-full'}>
										<Line className={'text-typo-secondary'}/>
									</div>
									<div className={'flex justify-end'}>
										<p className={'text-typo-secondary bg-neutral-0 z-10 pl-2 text-right'}>
											{formatAmount(getDepositReceiveTokens(), 2, 6, 24)}
										</p>
									</div>
								</dd>
							</div>

							<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
								<dt className={'text-typo-secondary whitespace-nowrap pr-2'}>{'USD Value'}</dt>
								<dd className={'w-full font-bold'}>
									<div className={'absolute bottom-1.5 w-full'}>
										<Line className={'text-typo-secondary'}/>
									</div>
									<div className={'flex justify-end'}>
										<p className={'text-typo-secondary bg-neutral-0 z-10 pl-2 text-right'}>
											{`$ ${formatAmount(getDepositReceiveValue(), 2, 2, 24)}`}
										</p>
									</div>
								</dd>
							</div>
						</dl>
					</div>
				</div>
			</div>
		);
	}

	/* 🔵 - Yearn Finance ******************************************************
	** Render for the buttons part for code splitting and readability
	**************************************************************************/
	function	renderButtons(): ReactNode {
		const decimals = currentVault?.token?.decimals || 18;

		if (actionType === 'withdraw') {
			return (
				<div className={'mt-4 grid grid-cols-1 gap-2 px-4 pb-4 md:px-6 md:pb-6'}>
					<Button
						variant={'light'}
						className={'h-12'}
						onClick={onWithdraw}
						isBusy={txStatusWithdraw.pending}
						isDisabled={
							!isActive
							|| amount === '' || Number(amount) === 0 
							|| Number(amount) > Number(formatUnits(shareOfVault || 0, decimals))
						}>
						{txStatusWithdraw.error ? 'Failed' : txStatusWithdraw.success ? 'Withdrawn!' : 'Withdraw'}
					</Button>
				</div>
			);
		}

		return (
			<div className={'mt-4 grid grid-cols-2 gap-2 px-4 pb-4 md:px-6 md:pb-6'}>
				<Button
					variant={'light'}
					className={'h-12'}
					onClick={onApprove}
					isBusy={txStatusApprove.pending}
					isDisabled={
						!isActive
						|| amount === '' || Number(amount) === 0 
						|| Number(amount) > Number(formatUnits(balanceOfToken || 0, decimals))
						|| Number(amount) <= Number(formatUnits(allowanceForToken || 0, decimals))
					}>
					{txStatusApprove.error ? 'Failed' : txStatusApprove.success ? 'Approved!' : 'Approve'}
				</Button>
				<Button
					variant={'filled'}
					className={'border-neutral-0/0 h-12 border-none'}
					onClick={onDeposit}
					isBusy={txStatusDeposit.pending}
					isDisabled={
						!isActive
						|| amount === '' || Number(amount) === 0 
						|| Number(amount) > Number(formatUnits(balanceOfToken || 0, decimals))
						|| Number(amount) > Number(formatUnits(allowanceForToken || 0, decimals))
					}>
					{txStatusDeposit.error ? 'Failed' : txStatusDeposit.success ? 'Deposited!' : 'Deposit'}
				</Button>
			</div>
		);
	}

	/* 🔵 - Yearn Finance ******************************************************
	** Main render for this component.
	**************************************************************************/
	return(
		<div>
			<div className={'my-4 px-4 md:my-6 md:px-6'}>
				<span className={'mb-4 inline-flex items-baseline space-x-2'}>
					<p
						onClick={(): void => set_actionType('deposit')}
						className={`cursor-pointer ${actionType === 'deposit' ? 'text-base font-bold text-neutral-700' : 'text-sm text-neutral-700/60 hover:text-neutral-700'}`}>
						{'Deposit'}
					</p>
					<p className={'text-sm text-neutral-700/60'}>{' / '}</p>
					<p
						onClick={(): void => set_actionType('withdraw')}
						className={`cursor-pointer ${actionType === 'withdraw' ? 'text-base font-bold text-neutral-700' : 'text-sm text-neutral-700/60 hover:text-neutral-700'}`}>
						{'Withdraw'}
					</p>
				</span>
				{renderInputField()}
			</div>

			{renderButtons()}
		</div>
	);
}

export default DepositCard;