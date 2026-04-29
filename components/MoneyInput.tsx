// components/MoneyInput.tsx
import React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface MoneyInputProps extends Omit<NumericFormatProps, 'onValueChange'> {
    value?: number;
    onValueChange: (value: number | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
    value,
    onValueChange,
    placeholder = "0,00",
    disabled = false,
    className = "",
    ...rest
}) => {
    return (
        <NumericFormat
            {...rest}
            value={value}
            onValueChange={(values) => {
                onValueChange(values.floatValue);
            }}
            thousandSeparator=" "
            decimalSeparator=","
            decimalScale={2}
            fixedDecimalScale={false}
            allowNegative={false}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            inputMode="decimal"
        />
    );
};