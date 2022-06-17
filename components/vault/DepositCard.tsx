import	React, {ReactElement, ReactNode}	from	'react';	
import	Image								from	'next/image';
import	{ethers}							from	'ethers';
import	{Input, Button}						from	'@yearn-finance/web-lib/components';
import	* as utils							from	'@yearn-finance/web-lib/utils';
import	{useSettings, useWeb3}				from	'@yearn-finance/web-lib/contexts';
import	Line								from	'components/icons/Line';
import	{approveERC20}						from	'utils/actions/approveToken';
import	{depositToken}						from	'utils/actions/depositToken';
import	{withdrawShare}						from	'utils/actions/withdrawShare';
import	useWallet							from	'contexts/useWallet';
import type {TVault}						from	'contexts/useYearn.d';

/* 🔵 - Yearn Finance **********************************************************
** The DepositCard component handle the whole logic to set the value to deposit
** or withdraw and perform the actual web3 action. It will use the user's info
** (provider, address) from the web-lib, it's wallet info from the useWallet
** context and will init a bunch of state variables to controle the flow. 
** The utils.Transaction flow is used to perform the transactions.
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
	const	[txStatusApprove, set_txStatusApprove] = React.useState(utils.defaultTxStatus);
	const	[txStatusDeposit, set_txStatusDeposit] = React.useState(utils.defaultTxStatus);
	const	[txStatusWithdraw, set_txStatusWithdraw] = React.useState(utils.defaultTxStatus);

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
			utils.performBatchedUpdates((): void => {
				set_shareOfVault(utils.format.BN(balances[utils.toAddress(currentVault.address)]?.raw));
				set_balanceOfToken(utils.format.BN(balances[utils.toAddress(currentVault.token.address)]?.raw));
				set_allowanceForToken(utils.format.BN(allowances[utils.toAddress(currentVault.token.address)]?.raw));
				if (actionType === 'deposit') {
					set_amount((previousAmount): string => (
						previousAmount === ''
							? (balances[utils.toAddress(currentVault.token.address)]?.normalized || '').toString()
							: previousAmount
					));
				} else {
					set_amount((previousAmount): string => (
						previousAmount === ''
							? (balances[utils.toAddress(currentVault.address)]?.normalized || '').toString()
							: previousAmount
					));
				}
				set_priceOfToken(utils.format.BN(prices[utils.toAddress(currentVault.token.address)]?.raw));
				set_priceOfVault(utils.format.BN(prices[utils.toAddress(currentVault.address)]?.raw));
			});
		} else {
			utils.performBatchedUpdates((): void => {
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
			new utils.Transaction(provider, approveERC20, set_txStatusApprove).populate(
				currentVault.token.address,
				networks[chainID === 1337 ? 1 : chainID  || 1].partnerContractAddress,
				utils.format.toSafeAmount(amount, balances[utils.toAddress(currentVault.token.address)].raw)
			).onSuccess(async (): Promise<void> => {
				await updateVaultData(currentVault);
				set_allowanceForToken(allowances[utils.toAddress(currentVault.token.address)].raw);
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
			new utils.Transaction(provider, depositToken, set_txStatusDeposit).populate(
				networks[chainID === 1337 ? 1 : chainID  || 1].partnerContractAddress,
				currentVault.address,
				utils.format.toSafeAmount(amount, balances[utils.toAddress(currentVault.token.address)].raw)
			).onSuccess(async (): Promise<void> => {
				await updateVaultData(currentVault);
				utils.performBatchedUpdates((): void => {
					set_shareOfVault(balances[utils.toAddress(currentVault.address)].raw);
					set_balanceOfToken(balances[utils.toAddress(currentVault.token.address)].raw);
					set_allowanceForToken(allowances[utils.toAddress(currentVault.token.address)].raw);
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
			new utils.Transaction(provider, withdrawShare, set_txStatusWithdraw).populate(
				currentVault.address,
				utils.format.toSafeAmount(amount, balances[utils.toAddress(currentVault.token.address)].raw)
			).onSuccess(async (): Promise<void> => {
				await updateVaultData(currentVault);
				utils.performBatchedUpdates((): void => {
					set_shareOfVault(balances[utils.toAddress(currentVault.address)].raw);
					set_balanceOfToken(balances[utils.toAddress(currentVault.token.address)].raw);
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
		const	_priceOfVault = utils.format.toNormalizedValue(priceOfVault, currentVault?.decimals || 18);
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
		const	_priceOfToken = utils.format.toNormalizedValue(priceOfToken, 6);
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
		const	_priceOfVault = utils.format.toNormalizedValue(priceOfVault, currentVault?.decimals || 18);
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
		const	_priceOfVault = utils.format.toNormalizedValue(priceOfVault, currentVault?.decimals || 18);
		const	_priceOfToken = (utils.format.toNormalizedValue(priceOfToken, 6));
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
				<div className={'grid grid-cols-1 gap-2 mt-2 md:grid-cols-1'}>
					<div>
						<div className={'flex flex-row ml-[-3px] space-x-2'}>
							<div className={'aspect-square flex flex-col justify-center items-center w-24 h-24 md:w-32 md:h-32 rounded-default min-w-24 bg-neutral-200 md:min-w-32'}>
								<div className={'w-8 h-8 md:w-12 md:h-12'}>
									<Image width={48} height={48} src={currentVault?.icon} />
								</div>
								<div className={'px-1 mt-2 text-sm text-center md:px-2 md:mt-4 md:text-base'}>
									<b>{currentVault?.symbol || ''}</b>
								</div>
							</div>
							<div className={'flex flex-col py-2 px-4 w-full h-24 md:py-4 md:px-6 md:h-32 rounded-default bg-neutral-200'}>
								<Input.BigNumber
									balance={utils.format.toNormalizedAmount(shareOfVault, currentVault?.decimals)}
									price={utils.format.toNormalizedValue(priceOfToken, 6) * utils.format.toNormalizedValue(priceOfVault, currentVault?.decimals || 18)}
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
							<dl className={'space-y-2 w-full'}>
								<div className={'flex overflow-hidden relative flex-row justify-between items-center w-full'}>
									<dt className={'pr-2 whitespace-nowrap text-typo-secondary'}>
										{currentVault?.token?.symbol}
									</dt>
									<dd className={'w-full font-bold'}>
										<div className={'absolute bottom-1.5 w-full'}>
											<Line className={'text-typo-secondary'}/>
										</div>
										<div className={'flex justify-end'}>
											<p className={'z-10 pl-2 text-right bg-neutral-0 text-typo-secondary'}>
												{utils.format.amount(getWithdrawReceiveTokens(), 2, 6)}
											</p>
										</div>
									</dd>
								</div>

								<div className={'flex overflow-hidden relative flex-row justify-between items-center w-full'}>
									<dt className={'pr-2 whitespace-nowrap text-typo-secondary'}>{'USD Value'}</dt>
									<dd className={'w-full font-bold'}>
										<div className={'absolute bottom-1.5 w-full'}>
											<Line className={'text-typo-secondary'}/>
										</div>
										<div className={'flex justify-end'}>
											<p className={'z-10 pl-2 text-right bg-neutral-0 text-typo-secondary'}>
												{`$ ${utils.format.amount(getWithdrawReceiveValue(), 2, 2)}`}
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
			<div className={'grid grid-cols-1 gap-2 mt-2 md:grid-cols-1'}>
				<div>
					<div className={'flex flex-row ml-[-3px] space-x-2'}>
						<div className={'aspect-square flex flex-col justify-center items-center w-24 h-24 md:w-32 md:h-32 rounded-default min-w-24 bg-neutral-200 md:min-w-32'}>
							<div className={'w-8 h-8 md:w-12 md:h-12'}>
								<Image width={48} height={48} src={currentVault?.token?.icon} />
							</div>
							<div className={'px-1 mt-2 text-sm text-center md:px-2 md:mt-4 md:text-base'}>
								<b>{currentVault?.token?.symbol || ''}</b>
							</div>
						</div>
						<div className={'flex flex-col py-2 px-4 w-full h-24 md:py-4 md:px-6 md:h-32 rounded-default bg-neutral-200'}>
							<Input.BigNumber
								balance={utils.format.toNormalizedAmount(balanceOfToken, currentVault?.decimals)}
								price={utils.format.toNormalizedValue(priceOfToken, 6)}
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
						<dl className={'space-y-2 w-full'}>
							<div className={'flex overflow-hidden relative flex-row justify-between items-center w-full'}>
								<dt className={'pr-2 whitespace-nowrap text-typo-secondary'}>{currentVault.symbol}</dt>
								<dd className={'w-full font-bold'}>
									<div className={'absolute bottom-1.5 w-full'}>
										<Line className={'text-typo-secondary'}/>
									</div>
									<div className={'flex justify-end'}>
										<p className={'z-10 pl-2 text-right bg-neutral-0 text-typo-secondary'}>
											{utils.format.amount(getDepositReceiveTokens(), 2, 6)}
										</p>
									</div>
								</dd>
							</div>

							<div className={'flex overflow-hidden relative flex-row justify-between items-center w-full'}>
								<dt className={'pr-2 whitespace-nowrap text-typo-secondary'}>{'USD Value'}</dt>
								<dd className={'w-full font-bold'}>
									<div className={'absolute bottom-1.5 w-full'}>
										<Line className={'text-typo-secondary'}/>
									</div>
									<div className={'flex justify-end'}>
										<p className={'z-10 pl-2 text-right bg-neutral-0 text-typo-secondary'}>
											{`$ ${utils.format.amount(getDepositReceiveValue(), 2, 2)}`}
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
		if (actionType === 'withdraw') {
			return (
				<div className={'grid grid-cols-1 gap-2 px-4 pb-4 mt-4 md:px-6 md:pb-6'}>
					<Button
						variant={'light'}
						className={'h-12'}
						onClick={onWithdraw}
						isBusy={txStatusWithdraw.pending}
						isDisabled={
							!isActive
							|| amount === '' || Number(amount) === 0 
							|| Number(amount) > Number(utils.format.units(shareOfVault || 0, 18))
						}>
						{txStatusWithdraw.error ? 'Failed' : txStatusWithdraw.success ? 'Withdrawn!' : 'Withdraw'}
					</Button>
				</div>
			);
		}
		return (
			<div className={'grid grid-cols-2 gap-2 px-4 pb-4 mt-4 md:px-6 md:pb-6'}>
				<Button
					variant={'light'}
					className={'h-12'}
					onClick={onApprove}
					isBusy={txStatusApprove.pending}
					isDisabled={
						!isActive
						|| amount === '' || Number(amount) === 0 
						|| Number(amount) > Number(utils.format.units(balanceOfToken || 0, 18))
						|| Number(amount) <= Number(utils.format.units(allowanceForToken || 0, currentVault?.token?.decimals || 18))
					}>
					{txStatusApprove.error ? 'Failed' : txStatusApprove.success ? 'Approved!' : 'Approve'}
				</Button>
				<Button
					variant={'filled'}
					className={'h-12 border-none border-neutral-0/0'}
					onClick={onDeposit}
					isBusy={txStatusDeposit.pending}
					isDisabled={
						!isActive
						|| amount === '' || Number(amount) === 0 
						|| Number(amount) > Number(utils.format.units(balanceOfToken || 0, 18))
						|| Number(amount) > Number(utils.format.units(allowanceForToken || 0, currentVault?.token?.decimals || 18))
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
			<div className={'px-4 my-4 md:px-6 md:my-6'}>
				<span className={'inline-flex items-baseline mb-4 space-x-2'}>
					<p
						onClick={(): void => set_actionType('deposit')}
						className={`cursor-pointer ${actionType === 'deposit' ? 'font-bold text-neutral-700 text-base' : 'text-sm text-neutral-700/60 hover:text-neutral-700'}`}>
						{'Deposit'}
					</p>
					<p className={'text-sm text-neutral-700/60'}>{' / '}</p>
					<p
						onClick={(): void => set_actionType('withdraw')}
						className={`cursor-pointer ${actionType === 'withdraw' ? 'font-bold text-neutral-700 text-base' : 'text-sm text-neutral-700/60 hover:text-neutral-700'}`}>
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