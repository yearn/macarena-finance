import React, {MutableRefObject, ReactElement, useRef} from 'react';
import {BigNumber, ethers} from 'ethers';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {toNormalizedValue} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {formatAmount, toSafeValue} from '@yearn-finance/web-lib/utils/format';

type	TInput = {
	value: string | number,
	onChange: (s: string | number) => void
	onSearch?: (s: string | number) => void
	ariaLabel?: string
	isWithMax?: boolean
	onMaxClick?: () => void
} & React.ComponentPropsWithoutRef<'input'>

type	TInputBigNumber = {
	value: string,
	onSetValue: (s: string) => void,
	onValueChange?: (s: string) => void,
	maxValue?: BigNumber,
	isWithMax?: boolean,
	decimals?: number,
	balance?: string,
	price?: number,
} & React.InputHTMLAttributes<HTMLInputElement>;

function	InputBase(props: TInput): ReactElement {
	const	{value, onChange, onSearch, ariaLabel = 'Search', isWithMax, onMaxClick, className, ...rest} = props;
	const	focusRef = useRef<MutableRefObject<HTMLInputElement | undefined> | any>();

	return (
		<form
			name={ariaLabel}
			onSubmit={(e): void => {
				e.preventDefault();
				if (onSearch) {
					onSearch(value);
				}
			}}>
			<div
				aria-label={ariaLabel}
				className={`yearn--input-field-wrapper ${className}`}>
				<span className={'sr-only'}>{ariaLabel}</span>
				<input
					ref={focusRef}
					value={value}
					onChange={(e): void => onChange(e.target.value)}
					type={props.type || 'text'}
					className={'yearn--input-field'}
					{...rest} />
				{isWithMax ? (
					<div
						className={'yearn--input-max'}
						onClick={(e): void => {
							e.stopPropagation();
							e.preventDefault();
							if (onMaxClick) {
								onMaxClick();
								if (focusRef.current) {
									(focusRef.current as unknown as HTMLInputElement).blur();
								}
							}
						}}>
						{'Max'}
					</div>
				) : null}
			</div>
		</form>
	);
}

function	InputBigNumber(props: TInputBigNumber): ReactElement {
	const {value, onSetValue, onValueChange, maxValue = ethers.constants.Zero, isWithMax = true, decimals = 18, balance = '', price = 0} = props;

	function	onChange(s: string): void {
		performBatchedUpdates((): void => {
			onSetValue(s);
			if (onValueChange) {
				onValueChange(s);
			}
		});
	}

	const	safeValue = toSafeValue(value);
	return (
		<label
			aria-invalid={isWithMax && (safeValue !== 0 && (safeValue > toNormalizedValue(maxValue, decimals)))}
			className={'yearn--input'}>
			<p>{`You have ${balance}`}</p>
			<Input
				value={value}
				type={'number'}
				min={0}
				onChange={(s: unknown): void => onChange(s as string)}
				onSearch={(s: unknown): void => onChange(s as string)}
				placeholder={'0.00000000'}
				max={toNormalizedValue(maxValue, decimals)}
				onMaxClick={(): void => {
					if (!maxValue.isZero()) {
						onChange(toNormalizedValue(maxValue, decimals).toString());
					}
				}}
				isWithMax={isWithMax}
				disabled={props.disabled} />
			<p>{`$ ${formatAmount(safeValue * price, 2, 2)}`}</p>
		</label>
	);
}

export const Input = Object.assign(InputBase, {BigNumber: InputBigNumber});
