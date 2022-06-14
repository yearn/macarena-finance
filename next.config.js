/* eslint-disable no-undef */
const dotenv = require('dotenv-webpack');

module.exports = {
	experimental: {
		concurrentFeatures: true
	},
	plugins: [new dotenv()],
	images: {
		domains: [
			'rawcdn.githack.com'
		]
	},
	env: {
		PARTNER_ID_ADDRESS: '0x0000000000000000000000000000000000000000',
		YEARN_PARTNER_CONTRACT_ADDRESS: {
			1: '0x8ee392a4787397126C163Cb9844d7c447da419D8',
			250: '0x086865B2983320b36C42E48086DaDc786c9Ac73B'
		},
		WEBSITE_URI: 'https://macarena.finance/',
		WEBSITE_NAME: 'Macarena Finance',
		WEBSITE_DESCRIPTION: 'Macarena finance, a UI for Yearn Finance that you actually want to fork',
		PROJECT_GITHUB_URL: 'https://github.com/yearn/macarena-finance',
		USE_WALLET: true,
		USE_PRICES: false,
		USE_NETWORKS: true,
		USE_PRICE_TRI_CRYPTO: false,
		ALCHEMY_KEY: process.env.ALCHEMY_KEY,
		CG_IDS: [],
		TOKENS: []
	}
};
