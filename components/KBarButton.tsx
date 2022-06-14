import	React, {ReactElement}	from 'react';
import	{Search}				from '@yearn-finance/web-lib/icons';
import	{useKBar}				from 'kbar';

/* 🔵 - Yearn Finance ******************************************************
** Uses the kbar package to be able to search for some elements accross the
** app. This simulate a search button with the key shortcut display and one
** unique action onClick: trigger the kbar modal.
** See kbar for more infor: https://kbar.vercel.app/docs/getting-started
***************************************************************************/
function	KBarButton(): ReactElement {
	const	{query} = useKBar();

	return (
		<div className={'macarena--kbar-wrapper'}>
			<label onClick={query.toggle} className={'macarena--kbar'}>
				<span className={'sr-only'}>{'search with kbar'}</span>
				<Search className={'macarena--kbar-searchIcon'} />
				<div className={'macarena--kbar-searchLabel'}>
					{'Search'}
				</div>
				<div className={'flex flex-row space-x-2'}>
					<div className={'macarena--kbar-key'}>{'⌘'}</div>
					<div className={'macarena--kbar-key'}>{'K'}</div>
				</div>
			</label>
		</div>
	);
}

export default KBarButton;
