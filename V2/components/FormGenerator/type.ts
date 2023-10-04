import React, { ReactNode } from "react";
import { InputProps } from "antd/lib/input";
import { SelectProps } from "antd/lib/select";
import { ControllerProps, RegisterOptions } from "react-hook-form";
import { CheckboxProps } from "antd/lib/checkbox";

export enum CustomFieldType {
  RECIPIENT_SELECT = "RECIPIENT_SELECT",
  RECIPIENT_BANK_SELECT = "RECIPIENT_BANK_SELECT",
  CATEGORY = "CATEGORY",
  TAX = "TAX",
  CURRENCY_INPUT = "CURRENCY_INPUT",
  TWO_WAY_PAYMENT = "TWO_WAY_PAYMENT",
  RECIPIENT_COUNTRY_SELECT = "RECIPIENT_COUNTRY_SELECT",
  RECIPIENT_CURRENCY_SELECT = "RECIPIENT_CURRENCY_SELECT",
  DATE_LIST = "DATE_LIST",
  PAYMENT_SCHEDULE = "PAYMENT_SCHEDULE",
  PAY_FROM = "PAY_FROM",
  ATTACHMENT = "ATTACHMENT",
  BANK_VALIDATION = "BANK_VALIDATION",
  TAGS = "TAGS",
}

export enum FieldType {
  INPUT = "INPUT",
  TEXT_AREA = "TEXT_AREA",
  SELECT = "SELECT",
  DATE = "DATE",
  SP_DATE = "SP_DATE",
  CHECKBOX = "CHECKBOX",
  RADIO = "RADIO",
  INPUTTAG = "INPUTTAG",
  ASYNC_SELECT = "ASYNC_SELECT",
}

export interface FormLabelProps {
  className?: string;
  label?: string | ReactNode;
  tooltip?: string;
  htmlFor?: string;
  required?: boolean;
  description?: string | React.ReactNode;
  withOCR?: boolean;
  isSameWithOCR?: boolean;
  children: React.ReactNode;
}

export type FormGeneratorProps = {
  fieldType: keyof typeof CustomFieldType | keyof typeof FieldType;
  [key: string]: any;
};

interface ControlledSelectProps extends SelectProps<any> {
  controllerProps: ControllerProps;
  countryCode?: string;
  currencyCode?: string;
}

export interface CurrencyInputProps extends InputProps {
  selectProps?: ControlledSelectProps;
  disabled?: boolean;
  placeholder?: string;
  inputGroupStyle?: Record<string, any>;
  onFocus?(event: any): void;
  onChangeAmount?: (amount: string) => void;
  onChangeCurrency?: (currency: string) => void;
}

export interface TwoPayPaymentInputProps extends CurrencyInputProps {
  label?: string;
  name: string;
  rules?: RegisterOptions;
  fieldProps?: InputProps & {
    fieldType: string;
    help?: string;
    isOnChangeRefetch?: boolean;
  };
}

export interface TwoWayPaymentProps {
  recipientGetProps: TwoPayPaymentInputProps;
  youPayProps: TwoPayPaymentInputProps;
  swiftPaymentProps: ControllerProps & {
    name: string;
    rules?: RegisterOptions;
    fieldProps: CheckboxProps & {
      fieldType: string;
    };
  };
}

export interface DateFieldProps {
  label?: string;
  name: string;
  rules?: RegisterOptions;
  fieldProps?: InputProps & {
    fieldType: string;
    help?: string;
  };
  onChange?(event: any): void;
}

export interface PaymentsScheduleProps {
  dateFieldProps: DateFieldProps;
  checkboxFieldProps: DateFieldProps;
}

export interface DateListPickerProps {
  name: string;
  value: string;
  placeholder: string;
  onChange: (string) => void;
  refField: string;
}

export interface BankValidationProps {
  label?: string;
  rules?: Record<string, any>;
  fieldType: CustomFieldType | FieldType;
  tooltip: string;
  isOnChangeRefetch: boolean;
  placeholder: string;
  disabled: boolean;
  textLabel?: string;
  pattern?: Record<string, any>;
  name: string;
  onChange: Function;
  value: string | undefined;
}

export interface VerifyBICResponse {
  isMatch: boolean;
  message: string;
  code: number;
}

export interface VerifyBICPayload {
  bicType: string;
  bic: string;
  senderCountry: string;
  receiverCountry: string;
  spenmoCode?: string;
}

export enum vendorDynamicFieldNames {
  countryCode = "countryCode",
  currencyCode = "currencyCode",
}

export enum BankValidationErrorMessage {
  REQUIRED_FIELD_ERROR = "This field cannot be empty",
  ERROR_COUNTRY_MISMATCH = "does not match the selected country above",
}
