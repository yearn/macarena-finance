import	React, {ReactElement, ReactNode}	from	'react';

type		TFilters = {
	availableCategories: string[],
	currentCategory: string,
	onSelect: (s: string) => void
}
function	Filters({availableCategories, currentCategory, onSelect}: TFilters): ReactElement {
	return (
		<div aria-label={'filters'} className={'flex flex-row justify-center items-center mb-7 -ml-1 space-x-2 md:ml-0'}>
			{availableCategories.map((category: string): ReactNode => (
				<button
					key={category}
					aria-selected={category === currentCategory}
					onClick={(): void => onSelect(category)}
					className={'flex justify-center items-center px-2 h-8 border transition-colors cursor-pointer rounded-default macarena--filter'}>
					<p className={'text-xs md:text-base'}>{category}</p>
				</button>
			))}
		</div>
	);
}

export default Filters;