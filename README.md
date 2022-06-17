# Macarena Finance
![](./public/og.png)

Macarena finance is a simple UI for Yearn Finance, made to be forked!

Running your own instance of Yearn makes you eligible to earn fees on top of all deposits made through your UI. See information on how partnership and profit-sharing work at our [Partner Docs](https://docs.yearn.finance/partners/introduction#profit-share-model)

**Table-of-content**
- [Live Demo](#live-demo)
- [Quickstart](#quickstart)
- [Themes](#themes)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)

## Live Demo

- https://macarena.finance/

## Quickstart

1. Clone the repository: `git clone https://github.com/yearn/macarena-finance.git`
2. Run `yarn` to install dependencies
3. Run `yarn run dev` to raise the developer environment
4. Open your browser at `http://localhost:3000`  

###  Configure profit fees address

5. At [`next.config.js`](./next.config.js) change `PARTNER_ID_ADDRESS` to the address that should receive the partner fees
6. Fill up [this template issue](https://github.com/yearn/macarena-finance/issues/new?assignees=&labels=partnership+request&template=partnership-request.yml) to request us to enable the above ID to receive partner program profit-sharing fees

### Add or remove Yearn Vaults displayed

Change the list filtering the vaults you want to show at:
- [`contexts/useYearn.tsx` lines 61~78](https://github.com/yearn/macarena-finance/blob/main/contexts/useYearn.tsx#L61-L78)  
and  
- [`contexts/useYearn.tsx` lines 163~190](https://github.com/yearn/macarena-finance/blob/main/contexts/useYearn.tsx#L163-L190)

## Themes

Customize the website css theme:

1. Change theme name in [`_document.tsx at line 26`](https://github.com/yearn/macarena-finance/blob/main/pages/_document.tsx#L26) and [`style.css at line 8`](https://github.com/yearn/macarena-finance/blob/main/style.css#L8)
2. Customize theme css in [`style.css`](https://github.com/yearn/macarena-finance/blob/main/style.css)

You can quickly change how everything looks by customizing [css variables in style.css](https://github.com/yearn/macarena-finance/blob/main/style.css#L9-L24). You can find the original CSS and the available CSS variables in the [Yearn Web Lib](https://github.com/yearn/web-lib/blob/main/packages/web-lib/style.css).

## Environment Variables

Create a `.env` file in the root project path overriding any env. variable:

- **WS_URL_MAINNET** custom websocket url for Ethereum Mainnet
- **WS_URL_FANTOM** custom websocket url for Fantom
- **RPC_URL_MAINNET** custom RPC url for Ethereum Mainnet
- **RPC_URL_FANTOM** custom RPC url for Fantom
- **ALCHEMY_KEY** [alchemy.com](https://www.alchemy.com/) key

Rename [`.env.example`](./.env.example) to `.env` to customize the above

## Tech Stack

The core libraries used by this project is:

- **TypeScript**: https://www.typescriptlang.org/
- **React**: https://reactjs.org/
- **Next**: https://nextjs.org/
- **Tailwind**: https://tailwindcss.com/
- **Yearn Web Lib**: https://github.com/yearn/web-lib

## Folder Structure

### [/components](./components)

Individual UI components reused across pages, like buttons and charts

### [/contexts](./contexts)

Individual components with no UI that helps manage the application state

### [/pages](./pages)

Each page corresponds to a route in nextjs. Any file created in this folder can be accessed through url routes, for example if you create a page "test.tsx" you will be able to access it locally at `http://localhost:3000/test`

Pages that start with `_` like `_app.tsx` and `_document.tsx` are the application's entry point and are handled by NextJS automatically

Read more about how to build app navigation at [NextJS Router Docs](https://nextjs.org/docs/api-reference/next/router#usage)

### [/utils](./utils)

Stateless functions to be reused at any file to transform data

### [/public](./public)

Static files used in the website, like images and icons