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
		//You need to change this one to your own ID!
		PARTNER_ID_ADDRESS: '0x7eE89ddd96603669eB0CC92D81f221b756813872',

		/* 🔵 - Yearn Finance **************************************************
		** Stuff used for the SEO or some related elements, like the title, the
		** github url etc.
		** - WEBSITE_URI is used to display the og image and get the base URI
		** - WEBSITE_NAME is used as name displayed on the top of the tab in
		**   the browser.
		** - WEBSITE_TITLE should be the name of your website. It may be used
		**   by third parties to display your app name (coinbase for instance)
		** - WEBSITE_DESCRIPTION is used in the meta tags
		** - PROJECT_GITHUB_URL should be the link to your project on GitHub
		**********************************************************************/
		WEBSITE_URI: 'https://macarena.finance/',
		WEBSITE_NAME: 'Macarena Finance',
		WEBSITE_TITLE: 'Macarena Finance',
		WEBSITE_DESCRIPTION: 'Macarena finance, a UI for Yearn Finance that you actually want to fork',
		PROJECT_GITHUB_URL: 'https://github.com/yearn/macarena-finance',

		/* 🔵 - Yearn Finance **************************************************
		** Some config used to control the behaviour of the web library. By
		** default, all of theses are set to false.
		** USE_WALLET: should we allow the user to connect a wallet via
		**             metamask or wallet connect?
		** USE_PRICES: should we fetch the prices for a list of tokens? If true
		**             the CG_IDS array should be populated with the tokens
		**             to fetch.
		** USE_PRICE_TRI_CRYPTO: should we fetch the special Tri Crypto token
		** 			   price? (require blockchain call)
		** USE_NETWORKS: indicate if the app should be able to change networks
		**********************************************************************/
		USE_WALLET: true,
		USE_PRICES: false,
		USE_NETWORKS: true,
		USE_PRICE_TRI_CRYPTO: false,
		CG_IDS: [],
		TOKENS: [],

		/* 🔵 - Yearn Finance **************************************************
		** Config over the RPC
		**********************************************************************/
		WEB_SOCKET_URL: {
			1: process.env.WS_URL_MAINNET,
			250: process.env.WS_URL_FANTOM,
			42161: process.env.WS_URL_ARBITRUM
		},
		JSON_RPC_URL: {
			1: process.env.RPC_URL_MAINNET,
			250: process.env.RPC_URL_FANTOM,
			42161: process.env.RPC_URL_ARBITRUM
		},
		ALCHEMY_KEY: process.env.ALCHEMY_KEY,
		INFURA_KEY: process.env.INFURA_KEY
	}
};
