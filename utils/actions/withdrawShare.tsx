import	{ContractInterface, ethers} from	'ethers';
import	VAULT_ABI					from	'utils/abi/vault.v2.abi';

export async function	withdrawShare(
	provider: ethers.providers.Web3Provider,
	vaultAddress: string,
	maxShares: ethers.BigNumber
): Promise<boolean> {
	const	signer = provider.getSigner();
	const	recipient = await signer.getAddress();

	try {
		const	contract = new ethers.Contract(
			vaultAddress,
			VAULT_ABI as ContractInterface,
			signer
		);
		const	transaction = await contract.withdraw(
			maxShares,
			recipient
		);
		const	transactionResult = await transaction.wait();
		if (transactionResult.status === 0) {
			console.error('Fail to perform transaction');
			return false;
		}

		return true;
	} catch(error) {
		console.error(error);
		return false;
	}
}