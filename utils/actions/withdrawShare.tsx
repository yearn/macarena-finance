import 	{TTxResponse, handleTx} 	from 	'@yearn-finance/web-lib/utils/web3/transaction';
import	{ContractInterface, ethers} from	'ethers';
import	VAULT_ABI					from	'utils/abi/vault.v2.abi';

export async function	withdrawShare(
	provider: ethers.providers.JsonRpcProvider,
	vaultAddress: string,
	maxShares: ethers.BigNumber
): Promise<TTxResponse> {
	const 	signer = provider.getSigner();
	const	recipient = await signer.getAddress();

	const	contract = new ethers.Contract(
		vaultAddress,
		VAULT_ABI as ContractInterface,
		signer
	);
	return await handleTx(contract.withdraw(
		maxShares,
		recipient
	));
}
