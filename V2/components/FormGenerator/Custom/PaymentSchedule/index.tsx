import React, { ChangeEvent, forwardRef, useEffect, useMemo, useState } from "react";
import qs from "query-string";
import { Controller, useFormContext } from "react-hook-form";
import { Input as AntdInput, Badge, Space } from "antd";
import { useMutableData } from "API/useData";
import dayjs from "dayjs";
import { API_URL } from "../../../../constants";
import { PaymentsScheduleProps, vendorDynamicFieldNames } from "../../type";
import Date from "../../SpDate";
import Checkbox from "../../Checkbox";
import { FormItem } from "../..";
import { useBillForm } from "Views/Bills/V2/context/FormContext";
import { GetBaseAuthObject } from "utility";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import styles from "./PaymentSchedule.module.scss";
import { BillFormProviderProps } from "Views/Bills/V2/BillForm/type";
import { WarningFilled } from "@spenmo/splice";

/**
 * This component is using react-hook-form.
 * Please use FormProvider before using this.
 * This component should NOT be copied to other page component
 * since it's using css from BillForm
 */
const PaymentSchedule = forwardRef((props: Partial<PaymentsScheduleProps>, ref: React.RefObject<AntdInput>) => {
  const { dateFieldProps, checkboxFieldProps } = props;
  const {
    label: dateInputLabel,
    name: dateInputName,
    rules: dateInputRules,
    onChange: onChangeDate,
    fieldProps: dateProps,
  } = dateFieldProps;

  const { help: dateETALabel } = dateProps;
  delete checkboxFieldProps?.fieldProps;

  const { label: checkBoxLabel, name: checkBoxName, rules: checkboxRules } = checkboxFieldProps;

  const [payImmediately, setPayImmediately] = useState(false);
  const [resetAllFields, setResetAllFields] = useState(false);

  const {
    control,
    watch,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useFormContext();
  const { vendorDetail } = useBillForm<BillFormProviderProps>();
  const { dynamicFields } = vendorDetail;

  const dateFormat = "YYYY-MM-DD";

  // Beneficiary country code
  const vendorCountryCode = useMemo(() => {
    return dynamicFields.find((item) => {
      return item.alias === vendorDynamicFieldNames.countryCode;
    })?.value;
  }, [dynamicFields]);

  // Extract value for api call
  const [amount, currency, dueDate, paymentScheduleDate, suggestDateCheckbox, addDateByCalender] = watch([
    "amount",
    "currency",
    "dueDate",
    "paymentScheduleDate",
    "suggestDateCheckbox",
    "addDateByCalender",
  ]);

  // Extract Sender country code
  const senderCountryCode = GetBaseAuthObject()?.orgCountryCode;

  const apiURL = useMemo(() => {
    if (amount && currency) {
      return qs.stringifyUrl({
        url: API_URL.schedulePayment,
        query: {
          dueDate: dueDate,
          amount: Number(amount), // API accepts a number
          currency: currency,
          beneficiaryBankCountry: vendorCountryCode,
          senderCountry: senderCountryCode,
        },
      });
    }
  }, [amount, currency, dueDate, senderCountryCode, vendorCountryCode]);

  const { data } = useMutableData(apiURL, {
    revalidateOnFocus: false,
  });

  // Update payment schedule date, If user back and change the due date
  useEffect(() => {
    if (paymentScheduleDate && suggestDateCheckbox) {
      const paymentScheduleDateValue = data?.data?.payload?.paymentScheduleDate;
      onChangeDate(paymentScheduleDateValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, onChangeDate]);

  // Show etimated payment days to user
  const estimatedDays: string = data?.data?.payload?.sla || "";

  const onSelectDate = (date: string, isPayNow: boolean | undefined) => {
    // Note: check date value is valid
    if (date) {
      setPayImmediately(isPayNow);
      onChangeDate(dayjs(date).format(dateFormat) as unknown as ChangeEvent<HTMLInputElement>);
      // Clear the error message
      clearErrors(dateInputName);
      // Unchecked the checkbox if the user select date manually
      setValue(checkBoxName, false);
      setValue("addDateByCalender", dayjs(date).format(dateFormat));
    }
  };

  const onClickSuggestPaymentDate = (evn: CheckboxChangeEvent, onChangeCheckbox: (isChecked: boolean) => void) => {
    if (evn.target.checked) {
      const paymentScheduleDateValue = data?.data?.payload?.paymentScheduleDate;
      if (paymentScheduleDateValue) {
        setPayImmediately(false);
        onChangeDate(paymentScheduleDateValue);
        onChangeCheckbox(evn.target.checked);
        // Clear the error message
        clearErrors(dateInputName);
      } else {
        // Show error notification for select due date
        setError(dateInputName, {
          message: dateInputRules?.required.toString(),
        });
      }
    } else {
      // Set payment schedule date to empty again
      onChangeCheckbox(evn.target.checked);
      onChangeDate(addDateByCalender || "");
      if (!addDateByCalender) setResetAllFields(true);
    }
  };

  // create date props
  const dateComponentProps = {
    ...dateProps,
    action: onSelectDate,
    defaultDate:
      suggestDateCheckbox || (!payImmediately && !addDateByCalender) ? paymentScheduleDate : addDateByCalender,
    name: dateInputName,
    showPlaceholderWithOutHasClear: true, // Show placeholder
    resetAllFields,
    setResetAllFields,
  };

  // Delete unused keys from props
  delete dateComponentProps.help;
  delete dateComponentProps.fieldType;

  return (
    <div className={styles.fieldContainer}>
      <FormItem
        className={styles.formItem}
        htmlFor={dateInputName}
        label={
          <Space className={styles.labelContainer}>
            <label>{dateInputLabel}</label>
            {estimatedDays && (
              <Badge status="success" text={`${dateETALabel} ${estimatedDays}`} className={styles.badgeColor} />
            )}
          </Space>
        }
        required={Boolean(dateInputRules?.required)}
      >
        {/* Improvement: onChange need to remove as we need date value on Confirm button */}
        <Date {...dateComponentProps} onChange={() => {}} />
      </FormItem>
      {errors[dateInputName] && (
        <div className={styles.errorContainer}>
          <WarningFilled iconColor="#E41B1B" size="16" />
          <p className={styles.errorMessage}>{errors[dateInputName].message}</p>
        </div>
      )}
      <Space align="center" className={styles.checkboxContainer}>
        <Controller
          name={checkBoxName}
          control={control}
          rules={checkboxRules}
          render={({ field }) => (
            <Checkbox
              {...field}
              disabled={Boolean(errors[dateInputName]) || !data}
              textLabel={checkBoxLabel}
              onChange={(evn) => onClickSuggestPaymentDate(evn, field.onChange)}
            />
          )}
        />
      </Space>
    </div>
  );
});

export default PaymentSchedule;
