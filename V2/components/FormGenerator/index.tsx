import React, { forwardRef } from "react";
import cn from "classnames";
import { InfoOutline, OcrSupportFilled, Tooltip } from "@spenmo/splice";

import RecipientSelect from "./Custom/RecipientSelect";
import Category from "./Custom/Category";
import Tax from "./Custom/Tax";
import CurrencyInput from "./Custom/CurrencyInput";
import TwoWayPayment from "./Custom/TwoWayPayment";
import RecipientCountrySelect from "./Custom/RecipientCountrySelect";
import RecipientCurrencySelect from "./Custom/RecipientCurrencySelect";
import RecipientBankSelect from "./Custom/RecipientBankSelect";
import PaymentSchedule from "./Custom/PaymentSchedule";
import DateListPicker from "./Custom/DateListPicker";
import BankValidation from "./Custom/BankValidation";
import Attachment from "./Custom/Attachment";
import PayFrom from "./Custom/PayFrom";
import Tags from "./Custom/Tags";
import Input from "./Input";
import Select from "./Select";
import Date from "./Date";
import Checkbox from "./Checkbox";
import InputTag from "./inputTag";
import AsyncSelect from "./AsyncSelect";
import TextArea from "./TextArea";
import Radio from "./Radio";
import SpDate from "./SpDate";

import Label from "Modules/DS/Atoms/Label";

import { CustomFieldType, FieldType, FormGeneratorProps, FormLabelProps } from "./type";
import styles from "./FormGenerator.module.scss";

export const FormGroup = (props: FormLabelProps) => {
  const { className, htmlFor, label, tooltip, children, ...rest } = props;
  return (
    <div className={cn(styles.formField, className)} {...rest}>
      <div className={styles.formLabel}>
        {Boolean(label) && <Label htmlFor={htmlFor}>{label}</Label>}
        {tooltip && (
          <Tooltip title={tooltip} placement="top">
            <InfoOutline size="16" iconColor="var(--icon-strong)" />
          </Tooltip>
        )}
      </div>
      <div className={styles.formGroup}>{children}</div>
    </div>
  );
};

export const FormItem = (props: FormLabelProps) => {
  const { className, htmlFor, label, required, children, description, tooltip, withOCR, isSameWithOCR, ...rest } =
    props;

  const ocrTooltip = isSameWithOCR
    ? {
        title: "This field has been filled by OCR",
        iconColor: "#5dd091",
      }
    : {
        title: "This field has been overwritten manually from OCR",
        iconColor: "var(--icon-disabled)",
      };

  return (
    <div className={cn(styles.formField, className)} {...rest}>
      {Boolean(label) && (
        <div className={styles.formLabel}>
          <Label htmlFor={htmlFor}>
            {label} {!required && <span>(Optional)</span>}
          </Label>
          {tooltip && (
            <Tooltip title={tooltip} placement="top">
              <InfoOutline size="16" iconColor="var(--icon-strong)" />
            </Tooltip>
          )}
          {withOCR && (
            <Tooltip title={ocrTooltip.title} placement="top">
              <OcrSupportFilled size="16" iconColor={ocrTooltip.iconColor} />
            </Tooltip>
          )}
        </div>
      )}
      {children}
      {Boolean(description) && <p className={styles.formFieldHelp}>{description}</p>}
    </div>
  );
};

const FormGenerator = forwardRef((props: FormGeneratorProps, ref) => {
  const { fieldType, ...rest } = props;

  // IMPROVEMENT: If you want to activate the ref
  // const fieldRef = useRef(null);
  // useImperativeHandle(ref, () => fieldRef.current);

  switch (fieldType) {
    // custom
    case CustomFieldType.RECIPIENT_SELECT: {
      return <RecipientSelect {...rest} />;
    }
    case CustomFieldType.RECIPIENT_BANK_SELECT: {
      return <RecipientBankSelect {...rest} />;
    }
    case CustomFieldType.CATEGORY: {
      return <Category {...rest} />;
    }
    case CustomFieldType.TAX: {
      return <Tax {...rest} />;
    }
    case CustomFieldType.CURRENCY_INPUT: {
      return <CurrencyInput {...rest} />;
    }
    case CustomFieldType.RECIPIENT_COUNTRY_SELECT: {
      return <RecipientCountrySelect {...rest} />;
    }
    case CustomFieldType.RECIPIENT_CURRENCY_SELECT: {
      return <RecipientCurrencySelect {...rest} />;
    }
    case CustomFieldType.TWO_WAY_PAYMENT: {
      return <TwoWayPayment {...rest} />;
    }
    case CustomFieldType.DATE_LIST: {
      return <DateListPicker {...rest} />;
    }
    case CustomFieldType.PAYMENT_SCHEDULE: {
      return <PaymentSchedule {...rest} />;
    }
    case CustomFieldType.PAY_FROM: {
      return <PayFrom {...rest} />;
    }
    case CustomFieldType.ATTACHMENT: {
      return <Attachment {...rest} />;
    }
    case CustomFieldType.BANK_VALIDATION: {
      return <BankValidation {...rest} />;
    }
    case CustomFieldType.TAGS: {
      return <Tags {...rest} />;
    }
    // standard
    case FieldType.INPUT: {
      return <Input {...rest} />;
    }
    case FieldType.TEXT_AREA: {
      return <TextArea {...rest} />;
    }
    case FieldType.SELECT: {
      return <Select {...rest} />;
    }
    case FieldType.SP_DATE: {
      return <SpDate {...rest} />;
    }
    case FieldType.DATE: {
      return <Date {...rest} />;
    }
    case FieldType.CHECKBOX: {
      return <Checkbox {...rest} />;
    }
    case FieldType.RADIO: {
      return <Radio {...rest} />;
    }
    case FieldType.INPUTTAG: {
      return <InputTag {...rest} />;
    }
    case FieldType.ASYNC_SELECT: {
      return <AsyncSelect {...rest} />;
    }
  }
});

export default FormGenerator;
