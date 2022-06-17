import	React, {ReactElement}		from	'react';
import	useSWR						from	'swr';
import	{request}					from	'graphql-request';
import	{Line}						from	'react-chartjs-2';
import	{Chart, Filler, Tooltip,
	CategoryScale, PointElement,
	LinearScale, LineElement}		from	'chart.js';
import	{Card}						from	'@yearn-finance/web-lib/components';
import	{format}					from	'@yearn-finance/web-lib/utils';
import	{useSettings}				from	'@yearn-finance/web-lib/contexts';
import	{useClientEffect}			from	'@yearn-finance/web-lib/hooks';

/* 🔵 - Yearn Finance **********************************************************
** Simple formula ((final value - initial value) / (initial value)) to get the
** growth between 2 values, scaled yearly.
******************************************************************************/
function getTimePeriodGrowth(data:  TChartDataSet[]): number {
	if (data.length === 0) {
		return (0);
	}
	const	vf = data[data.length - 1].value;
	const	vi = data[0].value;
	if (vf === 0) {
		return (0);
	}
	const secondsPerYear = 365 * 24 * 60 * 60;
	const timeBetween = (data[data.length - 1].timestamp / 1000) - (data[0].timestamp / 1000);
	return (((vf - vi) / vi) * (secondsPerYear / timeBetween) * 100);
}

type	TVaultDayData = {
	timestamp: string,
	pricePerShare: string
}
type	TChartDataSet = {
	label: string,
	timestamp: number,
	value: number
}
/* 🔵 - Yearn Finance **********************************************************
** The ChartCard component is focused on displaying a chart to make the data
** more accessible to users. Data are based on the official Yearn's subgraph,
** based on the PricePerShare each day for the last 7/14/30/365 days.
******************************************************************************/
function	ChartCard({address, price, chainID}: {address: string, price: number, chainID: number}): ReactElement {
	const	{networks} = useSettings();
	const	[isInit, set_isInit] = React.useState(false);
	const	[timeoutGrowth, set_timeoutGrowth] = React.useState({minTime: '', maxTime: '', growth: 0});
	const	[data, set_data] = React.useState<TVaultDayData[]>([]);

	/* 🔵 - Yearn Finance **************************************************
	** Below, we will fetch data from the subgraph to build our chart. We
	** want our chart to be fast and avoid useless re-render. To achieve
	** this, we will memorize the data for the different range we may need,
	** updating them once data is updated.
	**********************************************************************/
	const	data365d = React.useMemo((): TChartDataSet[] => (
		data.map((e: TVaultDayData): TChartDataSet => ({
			label: format.date(Number(e.timestamp)),
			timestamp: Number(e.timestamp),
			value: format.toNormalizedValue(e.pricePerShare, 18)
		}))
	), [data]);
	const	data30d = React.useMemo((): TChartDataSet[] => (
		data.slice(-30).map((e: TVaultDayData): TChartDataSet => ({
			label: format.date(Number(e.timestamp)),
			timestamp: Number(e.timestamp),
			value: format.toNormalizedValue(e.pricePerShare, 18)
		}))
	), [data]);
	const	data14d = React.useMemo((): TChartDataSet[] => (
		data.slice(-14).map((e: TVaultDayData): TChartDataSet => ({
			label: format.date(Number(e.timestamp)),
			timestamp: Number(e.timestamp),
			value: format.toNormalizedValue(e.pricePerShare, 18)
		}))
	), [data]);
	const	data7d = React.useMemo((): TChartDataSet[] => (
		data.slice(-7).map((e: TVaultDayData): TChartDataSet => ({
			label: format.date(Number(e.timestamp)),
			timestamp: Number(e.timestamp),
			value: format.toNormalizedValue(e.pricePerShare, 18)
		}))
	), [data]);
	const	[currentData, set_currentData] = React.useState(data30d);

	/* 🔵 - Yearn Finance **************************************************
	** We need to query the subgraph, with which we can get the historical
	** day data an construct the growth graph. We need to take the last 365
	** days to get our full set.
	**********************************************************************/
	const	{data: graphData} = useSWR(address ?
		`{
			vault(id: "${address?.toLowerCase()}") {
				vaultDayData(orderBy: timestamp, orderDirection: desc, first: 365) {
					timestamp
					pricePerShare
				}
			}
		}` : null, (query: string): any => request(networks[chainID === 1337 ? 1 : chainID  || 1].graphURI, query)
	);

	/* 🔵 - Yearn Finance **************************************************
	** Set the initial chart scale to max days
	**********************************************************************/
	React.useEffect((): void => {
		set_currentData(data365d);
	}, [data365d]);

	/* 🔵 - Yearn Finance **************************************************
	** When the data are available from the useSWR hook, we can sort them
	** to be sure we are working with the correct time order.
	**********************************************************************/
	React.useEffect((): void => {
		set_data((graphData?.vault?.vaultDayData || []).sort((a: any, b: any): number => (a.timestamp - b.timestamp)) || []);
	}, [graphData]);

	/* 🔵 - Yearn Finance **************************************************
	** Server Side Rendering hack to load the chartjs-plugin-zoom which uses
	** some browser only elements.
	**********************************************************************/
	useClientEffect((): void => {
		import('chartjs-plugin-zoom').then((plugin: any): void => {
			const	zoomPlugin = plugin.default;
			Chart.register(CategoryScale, PointElement, LinearScale, LineElement, Filler, Tooltip, zoomPlugin);
			set_isInit(true);
		});
	}, []);

	/* 🔵 - Yearn Finance **************************************************
	** The chart options, mostly used to customize what you see, with the
	** onZoomComplete callback for the chartjs-plugin-zoom plugin.
	**********************************************************************/
	const options: any = {
		responsive: true,
		animation: true,
		interaction: {intersect: false, mode: 'index', axis: 'x'},
		scales: {x: {display: false}, y: {display: false}},
		events: ['mousemove'],
		plugins: {
			tooltip: {
				callbacks: {
					label: (context: {raw: number}): string => {
						return `$ ${context.raw.toFixed(4)}`;
					}
				}
			},
			zoom: {
				zoom: {
					wheel: {enabled: false},
					pinch: {enabled: false},
					mode: 'x',
					drag: {enabled: true},
					onZoomComplete: onZoomComplete
				}
			}
		}		
	};

	function onZoomComplete({chart}: {chart: Chart}): void {
		const initialBounds = chart.getInitialScaleBounds().x;
		if (initialBounds.min != chart.scales.x.min || initialBounds.max != chart.scales.x.max){
			const slicedData = currentData.slice(chart.scales.x.min, chart.scales.x.max);
			const growth = getTimePeriodGrowth(slicedData);

			chart.resetZoom();	
			set_timeoutGrowth({
				minTime: slicedData[0].label.split(',')[0],
				maxTime: slicedData[slicedData.length - 1].label.split(',')[0],
				growth: growth
			});
			setTimeout((): void => set_timeoutGrowth({minTime: '', maxTime: '', growth: 0}), 5000);
		}
	}

	/* 🔵 - Yearn Finance **************************************************
	** While the chartjs-plugin-zoom plugin is not loaded, skip the render.
	**********************************************************************/
	if (!isInit) {
		return <Card className={'overflow-hidden col-span-1 w-full max-w-full md:col-span-2'} padding={'none'} />;
	}

	/* 🔵 - Yearn Finance **************************************************
	** Main render for this page.
	**********************************************************************/
	const	growth = getTimePeriodGrowth(currentData);
	return (
		<Card className={'overflow-hidden col-span-1 w-full max-w-full md:col-span-2'} padding={'none'}>
			<div className={'flex relative flex-col justify-end items-center -mx-0.5 h-full'}>
				<div className={'flex absolute top-4 flex-row justify-between items-center px-4 w-full'}>
					<div className={'grid grid-cols-4 gap-2'}>
						<div
							onClick={(): void => set_currentData(data7d)}
							className={`py-1 px-2 text-xs rounded-default cursor-pointer border ${currentData.length === 7 ? 'bg-accent-500 text-neutral-100 border-black' : 'text-neutral-500/70 border-neutral-500/70'}`}>
							{'7 days'}
						</div>
						<div
							onClick={(): void => set_currentData(data14d)}
							className={`py-1 px-2 text-xs rounded-default cursor-pointer border ${currentData.length === 14 ? 'bg-accent-500 text-neutral-100 border-black' : 'text-neutral-500/70 border-neutral-500/70'}`}>
							{'14 days'}
						</div>
						<div
							onClick={(): void => set_currentData(data30d)}
							className={`py-1 px-2 text-xs rounded-default cursor-pointer border ${currentData.length == 30 ? 'bg-accent-500 text-neutral-100 border-black' : 'text-neutral-500/70 border-neutral-500/70'}`}>
							{'30 days'}
						</div>
						<div
							onClick={(): void => set_currentData(data365d)}
							className={`py-1 px-2 text-xs rounded-default cursor-pointer border ${currentData.length > 30 ? 'bg-accent-500 text-neutral-100 border-black' : 'text-neutral-500/70 border-neutral-500/70'}`}>
							{'365 days'}
						</div>
					</div>
					<div>
						<b className={growth > 0 ? 'text-[#22c55e]' : ''}>
							{`${growth > 0 ? '+' : ''}${growth.toFixed(2)} %`}
						</b>
					</div>
				</div>
				<div className={'absolute top-16 text-xs text-center opacity-50'}>
					{timeoutGrowth?.minTime && timeoutGrowth?.maxTime && (timeoutGrowth.growth.toFixed(2) + '% annualised growth from ' + timeoutGrowth.minTime + ' to ' + timeoutGrowth.maxTime)}
				</div>
				<Line
					className={'-mb-0.5'}
					data={{
						labels: currentData.map((e): string => e.label),
						datasets: [{
							data: currentData.map((e): number => (e.value * price)),
							borderColor: 'hsla(49, 100%, 50%, 1)',
							backgroundColor: 'hsla(49, 100%, 50%, 0.5)',
							fill: true,
							pointRadius: 0,
							tension: 0.4
						}]
					}}
					options={options} />
			</div>
		</Card>
	);
}

export default ChartCard;