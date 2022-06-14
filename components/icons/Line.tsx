import	React, {ReactElement}		from	'react';

function	Line(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg {...props} width={'600'} height={'2'} viewBox={'0 0 600 2'} fill={'none'} xmlns={'http://www.w3.org/2000/svg'}>
			<line x1={'1'} y1={'1'} x2={'600'} y2={'1'} stroke={'currentcolor'} strokeWidth={'2'} strokeLinecap={'round'} strokeDasharray={'2 6'}/>
		</svg>
	);
}

export default Line;
