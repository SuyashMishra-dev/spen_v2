import React, { useEffect, useMemo, useState, forwardRef, RefObject } from "react";
import { Button, InfoFilled, Typography } from "@spenmo/splice";
import { useFormContext } from "react-hook-form";
import qs from "query-string";

import FormFooter from "../FormFooter";
import CustomController from "../CustomController";
import FieldController from "../../components/FieldController";

import { useBillForm } from "../../context/FormContext";
import { API_URL } from "../../constants";
import { useBillDetailFields } from "../../hooks/useBillFormFields";

import { generatePaymentDetailFields } from "./helper";
import { GetOrgCountryCode } from "utility";
import { BillFormProviderProps, BillFormStepProps } from "../type";

import styles from "./PaymentDetail.module.scss";
import { useErrorHandler } from "../../context/ErrorHandlerContext";

interface PaymentDetailProps extends BillFormStepProps {
  formPage: number;
  onChangeFormPage(formPage: number): void;
}

const PaymentDetail = forwardRef((props: PaymentDetailProps, formRef: RefObject<any>) => {
  const { onBack, onNext, formPage = 2, onChangeFormPage } = props;
  const { watch } = useFormContext();
  const { handleSaveDraft, refetchValues, isFxRateExpired } = useBillForm<BillFormProviderProps>();
  const { verifyErrorHandler } = useErrorHandler();
  const [showWarningMessage, setShowWarningMessage] = useState(isFxRateExpired);

  const refetchKeys = Object.keys(refetchValues);
  const refetchVals = watch(refetchKeys);

  const refetchParams = useMemo(() => {
    const params = {};

    refetchKeys.forEach((key, index) => {
      params[key] = refetchVals[index];
    });

    return params;
  }, [refetchKeys, refetchVals]);

  const paymentDetailFieldsURL = qs.stringifyUrl({
    url: API_URL.billDetailFields,
    query: {
      ...refetchParams,
      step: formPage,
      // IMPROVEMENT: when it's handled by BE
      // it's better to just send the orgID, and
      // let the BE get the countryCode on their own
      countryCode: GetOrgCountryCode(),
    },
  });

  // IMPROVEMENT: on changing to useSWR (get data from API)
  // please make the url to function that return the url
  // Ref: https://swr.vercel.app/docs/conditional-fetching
  const { data: PaymentDetailField } = useBillDetailFields(paymentDetailFieldsURL, {
    keepPreviousData: true,
  });

  const title = PaymentDetailField?.data?.payload?.title;

  const handleClickBack = () => {
    const { step } = PaymentDetailField?.data?.payload;

    if (step === 2) {
      onBack();
    } else {
      onChangeFormPage(step - 1);
    }
  };

  const handleClickNext = () => {
    if (!verifyErrorHandler()) {
      return;
    }

    const { next } = PaymentDetailField?.data?.payload;

    if (next === undefined) {
      onNext();
    } else {
      // go to additional fields
      onChangeFormPage(next);
    }
  };

  const formFields = useMemo(
    () => generatePaymentDetailFields(PaymentDetailField?.data?.payload?.fields),
    [PaymentDetailField?.data?.payload?.fields]
  );

  useEffect(() => {
    if (isFxRateExpired) {
      setShowWarningMessage(isFxRateExpired);
      // Note: scroll form component on top
      formRef.current.scrollTop = 0;
    }
  }, [formRef, isFxRateExpired]);

  return (
    <div>
      {showWarningMessage && (
        <div className={styles.warningMessageContainer}>
          <InfoFilled size="24" iconColor="#752005" />
          <Typography className={styles.title} variant="body-content" tag="p" size="m">
            The amount has been updated according to the current exchange rate
          </Typography>
        </div>
      )}
      {title && (
        <Typography className={styles.title} variant="body-content" weight={600} tag="h4" size="m">
          {title}
        </Typography>
      )}
      {formFields.map((item) => (
        <FieldController key={item.name} {...item}>
          {(props, Component) => {
            return (
              <CustomController {...props}>
                {(fieldProps: Record<string, any>) => <Component {...fieldProps} />}
              </CustomController>
            );
          }}
        </FieldController>
      ))}
      <FormFooter onClickBack={handleClickBack} onSubmit={handleClickNext} submitText="Next">
        <Button type="button" size="m" variant="secondary" onClick={handleSaveDraft}>
          Save as draft
        </Button>
      </FormFooter>
    </div>
  );
});

export default PaymentDetail;
