# Macarena Finance
![](./public/og.png)

Macarena finance is a simple UI for Yearn Finance, made to be forked!

Running your own instance of Yearn makes you eligible to earn fees on top of all deposits made through your UI. See information on how partnership and profit-sharing work at our [Partner Docs](https://docs.yearn.finance/partners/introduction#profit-share-model)

## Quickstart

**Live Demo:** https://macarena.finance/

1. Clone the repository: `git clone https://github.com/yearn/macarena-finance.git`
2. Run `yarn` to install dependencies
3. Run `yarn run dev` to raise the developer environment
4. Open your browser at `http://localhost:3000`  

**Configuring live environment to receive profit fees**

5. At [`next.config.js`](./next.config.js) change `PARTNER_ID_ADDRESS` to the address that should receive the partner fees
6. [Follow this template](https://github.com/yearn/macarena-finance/issues/new?assignees=&labels=partnership+request&template=partnership-request.yml) to request us to enable the above ID to receive partner program profit-sharing fees

**Add or remove Yearn Vaults displayed**

* Change the list filtering the vaults you want to show at [`contexts/useYearn.tsx` lines 61~78](https://github.com/yearn/macarena-finance/blob/main/contexts/useYearn.tsx#L61-L78)

## Stack

The core tech used by this project is:

- **TypeScript**: https://www.typescriptlang.org/
- **React**: https://reactjs.org/
- **Next**: https://nextjs.org/
- **Tailwind**: https://tailwindcss.com/

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