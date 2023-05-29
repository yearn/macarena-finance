import React, {ReactElement, ReactNode} from 'react';

type TFilters = {
	availableCategories: string[],
	currentCategory: string,
	onSelect: (s: string) => void
}

function Filters({availableCategories, currentCategory, onSelect}: TFilters): ReactElement {
	return (
		<div aria-label={'filters'} className={'mb-7 -ml-1 flex flex-row items-center justify-center space-x-2 md:ml-0'}>
			{availableCategories.map((category: string): ReactNode => (
				<button
					key={category}
					aria-selected={category === currentCategory}
					onClick={(): void => onSelect(category)}
					className={'rounded-default macarena--filter flex h-8 cursor-pointer items-center justify-center border px-2 transition-colors'}>
					<p className={'text-xs md:text-base'}>{category}</p>
				</button>
			))}
		</div>
	);
}

export default Filters;