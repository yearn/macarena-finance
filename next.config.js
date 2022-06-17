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
		PARTNER_ID_ADDRESS: '0x7eE89ddd96603669eB0CC92D81f221b756813872',
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
