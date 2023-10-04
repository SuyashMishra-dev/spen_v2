import React, { useMemo } from "react";
import cn from "classnames";
import { useFormContext } from "react-hook-form";
import { Button, ChevronDown } from "@spenmo/splice";
import qs from "query-string";

import FormFooter from "../FormFooter";
import FieldController from "../../components/FieldController";
import CustomController from "../CustomController";

import { useBillDetailFields } from "../../hooks/useBillFormFields";

import { GetOrgCountryCode } from "utility";

import { useBillForm } from "../../context/FormContext";
import { useErrorHandler } from "../../context/ErrorHandlerContext";
import { generateBillDetailFields } from "./helper";
import { API_URL } from "../../constants";
import { BillDetailFormProps, BillFormFields, BillFormProviderProps } from "../type";
import styles from "./BillDetail.module.scss";

const BillDetail = (props: BillDetailFormProps) => {
  const { onBack, onNext, isShowForm, onShowForm } = props;
  const { trigger, watch } = useFormContext();
  const { handleSaveDraft, refetchValues, ocrData } = useBillForm<BillFormProviderProps>();
  const { verifyErrorHandler } = useErrorHandler();

  const refetchKeys = Object.keys(refetchValues);
  const refetchVals = watch(refetchKeys);
  const ocrDataKey = useMemo(() => {
    return ocrData ? Object.keys(ocrData) : [];
  }, [ocrData]);

  const ocrRelatedFields = watch(ocrDataKey);

  const refetchParams = useMemo(() => {
    const params = {};

    refetchKeys.forEach((key, index) => {
      params[key] = refetchVals[index];
    });

    return params;
  }, [refetchKeys, refetchVals]);

  const billDetailFieldsURL = qs.stringifyUrl({
    url: API_URL.billDetailFields,
    query: {
      ...refetchParams,
      step: 1,
      // IMPROVEMENT: when it's handled by BE
      // it's better to just send the orgID, and
      // let the BE get the countryCode on their own
      countryCode: GetOrgCountryCode(),
    },
  });

  // IMPROVEMENT: on changing to useSWR (get data from API)
  // please make the url to function that return the url
  // Ref: https://swr.vercel.app/docs/conditional-fetching
  const { data: BillDetailField } = useBillDetailFields(billDetailFieldsURL, {
    keepPreviousData: true,
  });

  const handleClickNext = () => {
    if (!verifyErrorHandler()) {
      return;
    }
    trigger().then((isValid) => {
      if (isValid) {
        onNext();
      }
    });
  };

  const formFields = useMemo(() => {
    const formFields = {} as BillFormFields;
    ocrDataKey.forEach((key, index) => {
      formFields[key] = ocrRelatedFields[index];
    });
    return generateBillDetailFields(BillDetailField?.data?.payload?.fields, ocrData, formFields);
  }, [BillDetailField?.data?.payload?.fields, ocrData, ocrDataKey, ocrRelatedFields]);

  return (
    <div className={styles.billDetails}>
      {!isShowForm ? (
        <div className={cn(styles.formToggle)} onClick={onShowForm} role="button">
          <span>Or fill details manually</span>
          <ChevronDown className={styles.chevron} size="16" iconColor="#545454" />
        </div>
      ) : (
        <div className={styles.fadeIn}>
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
          <FormFooter onClickBack={onBack} onSubmit={handleClickNext} submitText="Next">
            <Button type="button" size="m" variant="secondary" onClick={handleSaveDraft}>
              Save as draft
            </Button>
          </FormFooter>
        </div>
      )}
    </div>
  );
};

export default BillDetail;
