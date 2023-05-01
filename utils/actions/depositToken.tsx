import {TTxResponse, handleTx} 			from 	'@yearn-finance/web-lib/utils/web3/transaction';
import	{ContractInterface, ethers} 	from	'ethers';
import	PARTNER_VAULT_ABI				from	'utils/abi/partner.vault.abi';

export async function	depositToken(
	provider: ethers.providers.JsonRpcProvider,
	partnerContractAddress: string,
	vaultAddress: string,
	amount: ethers.BigNumber
): Promise<TTxResponse> {
	const signer = provider.getSigner();
	const	contract = new ethers.Contract(
		partnerContractAddress,
		PARTNER_VAULT_ABI as ContractInterface,
		signer
	);
	return await handleTx(contract.deposit(
		vaultAddress,
		process.env.PARTNER_ID_ADDRESS as string,
		amount
	));
}
