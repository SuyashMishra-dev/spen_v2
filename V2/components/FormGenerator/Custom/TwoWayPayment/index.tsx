import React, { ChangeEvent, forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { Input as AntInput } from "antd";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import { Controller, ControllerProps, useFormContext } from "react-hook-form";
import qs from "query-string";

import { FormItem } from "../..";
import CurrencyInput from "../CurrencyInput";
import { useBillForm } from "Views/Bills/V2/context/FormContext";
import Breakdown from "./Breakdown";
import Checkbox from "../../Checkbox";

import useCheckFeatureStatus from "customHooks/featureCheck";
import { getData, postData } from "API/Client";

import { SPLIT_NAMES, SPLIT_TREATMENT_TYPES } from "Redux/splitio/constants";
import { API_URL } from "Views/Bills/V2/constants";
import { GetCurrencyCode, GetOrgCountryCode, debounce } from "utility";
import { TwoWayPaymentProps, vendorDynamicFieldNames } from "../../type";
import { BillFormProviderProps } from "Views/Bills/V2/BillForm/type";
import { BillFeeParameters, BillFeeResponse, CorridorTypes, SwiftPaymentChargeType } from "./type";

import styles from "./TwoWayPayment.module.scss";
import { Typography } from "@spenmo/splice";
import { useErrorHandler } from "Views/Bills/V2/context/ErrorHandlerContext";

/**
 * This component is using react-hook-form.
 * Please use FormProvider before using this.
 * This component should NOT be copied to other page component
 * since it's using css from BillForm
 */
const TwoWayPayment = forwardRef((props: Partial<TwoWayPaymentProps>, ref: React.RefObject<AntInput>) => {
  const { recipientGetProps, youPayProps, swiftPaymentProps } = props;
  const {
    label: recipientLabel,
    name: recipientName,
    rules: recipientRules,
    onChange: onChangeRecipient,
    fieldProps: recipientFieldProps,
  } = recipientGetProps;
  const { label: youPayLabel, name: youPayName, rules: youPayRules, fieldProps: youPayFieldProps } = youPayProps;
  const {
    name: swiftPaymentName,
    rules: swiftPaymentRules,
    defaultValue: swiftPaymentDefaultValue,
  } = swiftPaymentProps;
  const { setRefetchValues } = useBillForm();

  delete recipientFieldProps?.fieldType;
  delete youPayFieldProps?.fieldType;

  const [loading, setLoading] = useState(false);
  const [billFeeLoading, setBillFeeLoading] = useState(false);
  const [billFee, setBillFee] = useState<Partial<BillFeeResponse>>();
  const [isRecipientLastChange, setRecipientLastChange] = useState(true);

  const [isUsingTransferSectorCountry, setIsUsingTransferSectorCountry] = useState(false);
  const [transferSectorSplit, countryList] = useCheckFeatureStatus(SPLIT_NAMES.billTransferSector, true, true);
  const showNewTransferSector = transferSectorSplit === SPLIT_TREATMENT_TYPES.ON || isUsingTransferSectorCountry;

  const { control, watch, setValue } = useFormContext();
  // get vendorDetail here since the fields cannot be broken down into
  // multiple fields for now
  const { vendorDetail, isAmountChanged, setIsAmountChanged, isFxRateExpired, setIsFxRateExpired } =
    useBillForm<BillFormProviderProps>();
  const { handleError } = useErrorHandler();

  const [receiverAmount, youPayAmount, invoiceAmount, invoiceCurrency, swiftPaymentChargeType] = watch([
    recipientName,
    youPayName,
    "billTax.invoiceAmount",
    "billTax.invoiceCurrency",
    swiftPaymentName,
  ]);

  const vendorCountryCode = useMemo(() => {
    return vendorDetail?.dynamicFields?.find((item) => {
      return item.alias === vendorDynamicFieldNames.countryCode;
    })?.value;
  }, [vendorDetail?.dynamicFields]);

  const vendorCurrencyCode = useMemo(() => {
    return vendorDetail?.dynamicFields?.find((item) => {
      return item.alias === vendorDynamicFieldNames.currencyCode;
    })?.value;
  }, [vendorDetail?.dynamicFields]);

  const youPayCountryCode = GetOrgCountryCode();
  const youPayCurrencyCode = GetCurrencyCode();

  const toggleRefetchYouPay = () => {
    if (youPayFieldProps?.isOnChangeRefetch) {
      setRefetchValues((prev) => {
        return {
          ...prev,
          [youPayName]: true,
        };
      });
    } else {
      setRefetchValues((prev) => {
        const { [youPayName]: deleteKey, ...rest } = prev || {};

        return rest;
      });
    }
  };

  const fetchBillFee = (params: Partial<BillFeeParameters>) => {
    const isReceiver = "receiverAmount" in params;
    const isSender = "totalAmount" in params;
    if (isReceiver || isSender) {
      const getBillFeeAPI = qs.stringifyUrl({
        url: API_URL.getBillFee,
        query: {
          ...params,
          receiverCountryCode: vendorCountryCode,
          receiverCurrency: vendorCurrencyCode,
          senderCurrency: youPayCurrencyCode,
        },
      });

      setBillFeeLoading(true);
      return getData(getBillFeeAPI)
        .then((res) => {
          const billFee = res?.data?.payload;
          const { amountFx, totalAmount, receiverAmount, amountFxRate } = billFee;

          setBillFee(billFee);
          // IMPROVEMENT: should just give back what's on the field (BE changes)
          // custom amount value
          setValue("walletAmount", amountFx);
          // Note: save fxRate which use in preview page
          setValue("fxRate", amountFxRate);

          if (isReceiver) {
            setValue(youPayName, totalAmount);
            toggleRefetchYouPay();
          } else {
            setValue(recipientName, receiverAmount);
          }
        })
        .catch((e) => {
          // TO DO: if failed
          console.error(e);
          handleError({
            retry: {
              id: "fetchBillFee",
              onClickRetry: () => fetchBillFee(params),
            },
          });
        })
        .finally(() => {
          setBillFeeLoading(false);
        });
    }
  };

  const getBillFee = useCallback(debounce(fetchBillFee), [
    recipientName,
    vendorCountryCode,
    vendorCurrencyCode,
    youPayCurrencyCode,
    youPayName,
  ]);

  const handleChangeRecipient = (amount: string) => {
    getBillFee({
      receiverAmount: Number(amount),
      swiftPaymentChargeType,
    });
    setRecipientLastChange(true);
    onChangeRecipient(amount as unknown as ChangeEvent<HTMLInputElement>);
  };

  const handleChangeYouPay = (amount: string, onChangeCb: Function) => {
    getBillFee({
      totalAmount: Number(amount),
      swiftPaymentChargeType,
    });
    toggleRefetchYouPay();
    setRecipientLastChange(false);
    onChangeCb(amount as unknown as ChangeEvent<HTMLInputElement>);
  };

  const handleChangeSwiftPayment = (e: CheckboxChangeEvent, onChangeCb: Function) => {
    const value = e.target.checked ? SwiftPaymentChargeType.OUR : SwiftPaymentChargeType.SHA;
    const params: Partial<BillFeeParameters> = isRecipientLastChange
      ? {
          receiverAmount: Number(receiverAmount),
        }
      : {
          totalAmount: Number(youPayAmount),
        };

    params.swiftPaymentChargeType = value;

    fetchBillFee(params).then(() => {
      onChangeCb(value);
    });
  };

  const fetchGetRecipientAmount = () => {
    setLoading(true);
    postData(API_URL.getRecipientAmount, {
      billAmount: Number(invoiceAmount),
      billCurrency: invoiceCurrency,
      recipientCurrency: vendorCurrencyCode,
    })
      .then((res) => {
        const { recipientAmount } = res.data.payload;
        handleChangeRecipient(recipientAmount);
        // only set to false if success
        setIsAmountChanged(false);
      })
      .catch((e) => {
        console.error(e);
        handleError({
          retry: {
            id: "fetchGetRecipientAmount",
            onClickRetry: fetchGetRecipientAmount,
          },
        });
      })
      .finally(() => {
        // TO DO: do we need a loader?
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isAmountChanged) {
      fetchGetRecipientAmount();
    }
  }, []);

  useEffect(() => {
    if (youPayCountryCode && countryList) {
      setIsUsingTransferSectorCountry(Boolean(countryList[youPayCountryCode]));
    }
  }, [youPayCountryCode, countryList]);

  useEffect(() => {
    if (isFxRateExpired) {
      getBillFee({
        receiverAmount: Number(receiverAmount),
        swiftPaymentChargeType,
      });
      setIsFxRateExpired(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFxRateExpired]);

  // TO DO: implement and watch swiftPaymentChargeType
  const isPayFull = swiftPaymentChargeType === SwiftPaymentChargeType.OUR;
  const isInterGlobal = billFee?.corridor === CorridorTypes.internationalGlobal;

  // IMPROVEMENT: validation that should be from the BE
  const isInterGlobalUSD = vendorCurrencyCode === "USD" && isInterGlobal;

  return (
    <div>
      <FormItem
        htmlFor={recipientName}
        label={recipientLabel}
        required={Boolean(recipientRules?.required)}
        tooltip="Recipient currency is determined by the saved recipient details. Edit the recipient details to change the currency."
      >
        <CurrencyInput
          ref={ref}
          name={recipientName}
          selectProps={{
            controllerProps: {
              // IMPROVEMENT: should not do it manually like this
              // either put the currency field manually before submit
              // or put it inside the custom useBillFormFields hooks (recommended)
              name: "currency",
              rules: {
                required: true,
              },
            } as ControllerProps,
            countryCode: vendorCountryCode,
            currencyCode: vendorCurrencyCode,
            disabled: true,
          }}
          onChangeAmount={handleChangeRecipient}
          {...recipientFieldProps}
          disabled={loading}
        />
      </FormItem>
      {!isPayFull && isInterGlobalUSD && (
        <Typography className={styles.globalUSD} variant="body-content" size="s" tag="p">
          Intermediary fees may apply
        </Typography>
      )}
      <Breakdown billFee={billFee} youPayCurrencyCode={youPayCurrencyCode} isLoading={billFeeLoading} />
      <FormItem
        className={styles.customField}
        htmlFor={youPayName}
        label={youPayLabel}
        required={Boolean(youPayRules?.required)}
      >
        <Controller
          name={youPayName}
          control={control}
          rules={youPayRules}
          render={({ field }) => (
            <CurrencyInput
              {...field}
              onChangeAmount={(amount: string) => handleChangeYouPay(amount, field.onChange)}
              selectProps={{
                controllerProps: {
                  name: "youPayCurrency",
                  rules: {
                    required: true,
                  },
                } as ControllerProps,
                disabled: true,
                countryCode: youPayCountryCode,
                currencyCode: youPayCurrencyCode,
              }}
              {...youPayProps.fieldProps}
              disabled={loading}
            />
          )}
        ></Controller>
      </FormItem>
      {isInterGlobalUSD && showNewTransferSector && (
        <div className={styles.swiftPayment}>
          <Controller
            name={swiftPaymentName}
            defaultValue={swiftPaymentDefaultValue}
            control={control}
            rules={swiftPaymentRules}
            render={({ field }) => {
              const value = field.value === SwiftPaymentChargeType.OUR;
              return (
                <Checkbox
                  {...field}
                  value={value}
                  onChange={(e: CheckboxChangeEvent) => handleChangeSwiftPayment(e, field.onChange)}
                  textLabel="Pay Full Amount Guarantee to ensure full payment to recipient"
                />
              );
            }}
          />
        </div>
      )}
    </div>
  );
});

export default TwoWayPayment;
