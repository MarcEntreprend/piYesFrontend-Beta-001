// components/MoneyInput.tsx
import React, { useState } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface MoneyInputProps extends Omit<NumericFormatProps, 'onValueChange'> {
    value?: number;
    onValueChange: (value: number | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    maxValue?: number;
    showWarning?: boolean;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
    value,
    onValueChange,
    placeholder = "0,00",
    disabled = false,
    className = "",
    maxValue = 100000,
    showWarning = true,
    ...rest
}) => {
    const [isMaxReached, setIsMaxReached] = useState(false);

    return (
        <>
            <NumericFormat
                {...rest}
                value={value}
                onValueChange={(values) => {
                    let newValue = values.floatValue;
                    const isOverMax = newValue !== undefined && maxValue !== undefined && newValue > maxValue;
                    if (isOverMax) {
                        newValue = maxValue;
                        if (showWarning && !isMaxReached) {
                            setIsMaxReached(true);
                            setTimeout(() => setIsMaxReached(false), 2000);
                        }
                    }
                    onValueChange(newValue);
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
                isAllowed={(values) => {
                    const { floatValue } = values;
                    if (floatValue === undefined) return true;
                    if (maxValue !== undefined && floatValue > maxValue) {
                        if (showWarning && !isMaxReached) {
                            setIsMaxReached(true);
                            setTimeout(() => setIsMaxReached(false), 2000);
                        }
                        return false;
                    }
                    return true;
                }}
            />
            {showWarning && isMaxReached && (
                <p className="text-red-500 text-xs mt-1 animate-pulse">
                    Montant maximum : {maxValue.toLocaleString('fr-FR')} G.
                </p>
            )}
        </>
    );
};