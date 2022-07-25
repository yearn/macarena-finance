import	React, {ReactElement}										from	'react';
import	{AppProps}													from	'next/app';
import	Image														from	'next/image';
import	Link														from	'next/link';
import	{useRouter}													from	'next/router';
import	{AnimatePresence, motion}									from	'framer-motion';
import	{KBarProvider, Action, createAction, useRegisterActions}	from	'kbar';
import	{useWeb3, WithYearn}										from	'@yearn-finance/web-lib/contexts';
import	{Dropdown}													from	'@yearn-finance/web-lib/components';
import	{truncateHex}												from	'@yearn-finance/web-lib/utils';
import	{NetworkEthereum, NetworkFantom, SocialDiscord,
	SocialGithub, SocialTwitter}									from	'@yearn-finance/web-lib/icons';
import	useYearn, {YearnContextApp}									from	'contexts/useYearn';
import	Meta														from	'components/Meta';
import	KBar														from	'components/Kbar';
import	KBarButton													from	'components/KBarButton';
import	LogoMacarena												from	'components/icons/LogoMacarena';

import	'../style.css';

const transition = {duration: 0.3, ease: [0.17, 0.67, 0.83, 0.67]};
const thumbnailVariants = {
	initial: {y: 20, opacity: 0, transition},
	enter: {y: 0, opacity: 1, transition},
	exit: {y: -20, opacity: 0, transition}
};

type TDropdownOption = {
	icon?: ReactElement;
	value: string | number;
	label: string;
};
function	Header(): ReactElement {
	const	options: TDropdownOption[] = [
		{icon: <NetworkEthereum />, label: 'Ethereum', value: 1},
		{icon: <NetworkFantom />, label: 'Fantom', value: 250}
	];

	const	{chainID, onSwitchChain, isActive, address, ens, openLoginModal, onDesactivate} = useWeb3();
	const	[walletIdentity, set_walletIdentity] = React.useState('Connect wallet');
	const	[selectedOption, set_selectedOption] = React.useState(options[0]);
	
	React.useEffect((): void => {
		if (!isActive) {
			set_walletIdentity('Connect wallet');
		} else if (ens) {
			set_walletIdentity(ens);
		} else if (address) {
			set_walletIdentity(truncateHex(address, 4));
		} else {
			set_walletIdentity('Connect wallet');
		}
	}, [ens, address, isActive]);

	React.useEffect((): void => {
		const	_selectedOption = options.find((e): boolean => e.value === Number(chainID)) || options[0];
		set_selectedOption(_selectedOption);
	}, [chainID, isActive]);

	return (
		<header className={'flex static inset-x-0 top-0 flex-row mb-5 w-full h-24 macarena--header bg-neutral-0'}>
			<div className={'mx-auto w-full h-full rounded-sm bg-neutral-0'}>
				<div className={'mx-auto w-full max-w-6xl h-full'}>
					<div className={'grid grid-cols-3 justify-center w-full h-full'}>
						<div aria-label={'search'} className={'hidden justify-start items-center md:flex'}>
							<KBarButton />
						</div>
						<div aria-label={'logo'} className={'flex col-span-3 justify-center items-center md:col-span-1'}>
							<Link href={'/'}>
								<div>
									<LogoMacarena className={'cursor-pointer'} />
								</div>
							</Link>
						</div>
						<div aria-label={'wallet and network'} className={'hidden flex-row justify-end items-center space-x-4 md:flex'}>
							<div className={'hidden flex-row items-center space-x-4 md:flex'}>
								<Dropdown
									defaultOption={options[0]}
									options={options}
									selected={selectedOption}
									onSelect={(option: TDropdownOption): void => onSwitchChain(option.value as number, true)} />
							</div>
							<button
								onClick={(): void => {
									if (isActive)
										onDesactivate();
									else
										openLoginModal();
								}}
								data-variant={'light'}
								className={'truncate yearn--button'}>
								{walletIdentity}
							</button>
						</div>
					</div>
				</div>

			</div>
		</header>
			
	);
}

function	WithLayout(props: AppProps): ReactElement {
	const	{Component, pageProps, router} = props;

	function handleExitComplete(): void {
		if (typeof window !== 'undefined') {
			window.scrollTo({top: 0});
		}
	}

	return (
		<div id={'app'}>
			<Header />
			<div className={'flex flex-col mx-auto mb-0 w-full max-w-6xl'}>
				<AnimatePresence exitBeforeEnter onExitComplete={handleExitComplete}>
					<motion.div
						key={router.pathname}
						initial={'initial'}
						animate={'enter'}
						exit={'exit'}
						variants={thumbnailVariants}>
						<Component {...pageProps} />
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}

function	KBarWrapper(): React.ReactElement {
	const	[actions, set_actions] = React.useState<Action[]>([]);
	const	{vaults} = useYearn();
	const	router = useRouter();

	React.useEffect((): void => {
		const	_actions = [];
		for (const vault of vaults) {
			_actions.push(createAction({
				name: vault.display_name || vault.name,
				keywords: `${vault.display_name || vault.name} ${vault.symbol} ${vault.address}`,
				section: 'Vaults',
				perform: async (): Promise<boolean> => router.push(`/vault/${vault.address}`),
				icon: <Image src={vault.token.icon} alt={vault.display_name || vault.name} width={36} height={36} />,
				subtitle: `${vault.address} - ${vault.token.symbol}`
			}));
		}
		set_actions(_actions);
	}, [vaults]); // eslint-disable-line react-hooks/exhaustive-deps
	useRegisterActions(actions, [actions]);

	return <span />;
}

function	AppWrapper(props: AppProps): ReactElement {
	const	{router} = props;
	const initialActions = [{
		id: 'homeAction',
		name: 'Home',
		shortcut: ['h'],
		keywords: 'back',
		section: 'Navigation',
		perform: async (): Promise<boolean> => router.push('/')
	},
	{
		id: 'githubaction',
		name: 'Github',
		shortcut: ['g'],
		keywords: 'github code',
		section: 'Social',
		icon: <SocialGithub className={'w-9 h-9'} />,
		perform: async (): Promise<unknown> => window.open('https://github.com/yearn', '_blank')
	},
	{
		id: 'twitterAction',
		name: 'Twitter',
		shortcut: ['t'],
		keywords: 'social contact dm',
		section: 'Social',
		icon: <SocialTwitter className={'w-9 h-9'} />,
		perform: async (): Promise<unknown> => window.open('https://twitter.com/iearnfinance', '_blank')
	},
	{
		id: 'discordAction',
		name: 'Discord',
		shortcut: ['d'],
		keywords: 'discord',
		section: 'Social',
		icon: <SocialDiscord className={'w-9 h-9'} />,
		perform: async (): Promise<unknown> => window.open('https://discord.yearn.finance', '_blank')
	}];

	return (
		<>
			<Meta />
			<KBarProvider actions={initialActions}>
				<div className={'z-[9999]'}>
					<KBar />
					<KBarWrapper />
				</div>
				<WithLayout {...props} />
			</KBarProvider>
		</>
	);
}

function	MyApp(props: AppProps): ReactElement {
	const	{Component, pageProps} = props;
	
	return (
		<WithYearn
			options={{
				ui: {
					shouldUseThemes: false
				},
				web3: {
					defaultChainID: 1,
					supportedChainID: [1, 250, 1337]
				}
			}}>
			<YearnContextApp>
				<AppWrapper
					Component={Component}
					pageProps={pageProps}
					router={props.router} />
			</YearnContextApp>
		</WithYearn>
	);
}

export default MyApp;
