import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import cn from "classnames";
import qs from "query-string";
import { Controller, useFormContext } from "react-hook-form";
import { Select, Input as AntdInput } from "antd";

import Input from "Modules/DS/Input";
import IconImage from "Modules/icons";

import { useMutableData } from "API/useData";

import { API_URL } from "../../../../constants";
import { CurrencyInputProps } from "../../type";

import { BillFieldNames, BillFormProviderProps, FieldConsumerType } from "Views/Bills/V2/BillForm/type";
import { useBillForm } from "Views/Bills/V2/context/FormContext";
import styles from "./CurrencyInput.module.scss";
import { keyPathToObject } from "utility";

const { Option } = Select;

/**
 * This component is using react-hook-form.
 * Please use FormProvider before using this.
 * This component should NOT be copied to other page component
 * since it's using css from BillForm
 */
const CurrencyInput = forwardRef((props: CurrencyInputProps & FieldConsumerType, ref: React.RefObject<AntdInput>) => {
  const {
    onChangeAmount,
    onChangeCurrency,
    onFocus,
    disabled,
    placeholder = "Enter an amount",
    inputGroupStyle,
    selectProps,
    name: amountName,
    isOnChangeRefetch,
    resetFields,
    ...rest
  } = props;
  const { controllerProps, countryCode = "", currencyCode, disabled: selectDisabled, ...restSelect } = selectProps;
  const { name: selectName } = controllerProps || {};

  const {
    control,
    watch,
    resetField,
    formState: { dirtyFields },
  } = useFormContext();
  const { setIsAmountChanged } = useBillForm<BillFormProviderProps>();
  const amount = watch(amountName, "");
  const currency = watch(selectName);

  const inputRef = useRef(null);
  useImperativeHandle(ref, () => inputRef.current);

  const apiURL = qs.stringifyUrl(
    {
      url: API_URL.currency,
      query: {
        filterBy: "org",
        recipientCountry: countryCode,
      },
    },
    {
      skipEmptyString: true,
    }
  );

  const { data, isValidating } = useMutableData(apiURL, {
    revalidateOnFocus: false,
  });

  const currencyList = data?.data?.payload?.result;

  const resetTriggerRecipientAmount = () => {
    // Change recipientAmount
    if (amountName === BillFieldNames.invoiceAmount) {
      setIsAmountChanged(true);
    }
  };

  // update currency when the currency list is changing
  useEffect(() => {
    if (currencyList && !keyPathToObject(dirtyFields, selectName)) {
      const defaultCurrency = currencyList.find((item) => item.CurrencyCode === currencyCode);
      resetTriggerRecipientAmount();

      resetField(selectName, {
        defaultValue: (defaultCurrency || currencyList[0]).CurrencyCode,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyList, currencyCode, selectName]);

  const renderCurrencyOptions = useCallback(() => {
    const source = (currencyCode: string) =>
      `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/${currencyCode
        ?.toLowerCase()
        ?.substr(0, 2)}.svg`;

    return currencyList?.map((item) => (
      <Option key={item.CurrencyCode} value={item.CurrencyCode}>
        <div className={styles.options}>
          <IconImage alt={item.CurrencyCode} className={styles.flag} src={source(item.CurrencyCode)} />
          {item.CurrencyCode}
        </div>
      </Option>
    ));
  }, [currencyList]);

  const handleChangeCurrency = (value, onChangeCb) => {
    resetTriggerRecipientAmount();

    onChangeCb(value);
  };

  const handleChangeAmount = (amount: string) => {
    // IMPROVEMENT: remove CurrencyInput component
    // and make it from select + input(number)

    resetTriggerRecipientAmount();

    onChangeAmount(amount);
  };

  return (
    <div className={styles.currencyInput}>
      <div
        className={cn(styles.inputGroup, {
          [styles.withDropdown]: !selectDisabled,
          ...inputGroupStyle,
        })}
      >
        <Controller
          {...controllerProps}
          control={control}
          render={({ field }) => {
            const { onChange } = field;

            return (
              <Select
                {...field}
                data-testid={`selectCurrency-${selectName}`}
                loading={isValidating}
                showSearch
                suffixIcon={selectDisabled ? null : undefined}
                disabled={selectDisabled}
                onChange={(value) => {
                  handleChangeCurrency(value, onChange);
                }}
                {...restSelect}
              >
                {renderCurrencyOptions()}
              </Select>
            );
          }}
        />
        <Input
          {...rest}
          className={styles.input}
          ref={inputRef}
          placeholder={placeholder}
          onChange={handleChangeAmount}
          value={amount}
          currency={currency}
          onFocus={onFocus}
          disabled={disabled}
        />
      </div>
    </div>
  );
});

export default CurrencyInput;
