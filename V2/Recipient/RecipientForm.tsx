import React, { Fragment, useContext, useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { GetBaseAuthObject } from "utility";
import FieldController from "../components/FieldController";
import { useRecipientDetailFields } from "../hooks/useRecipientFormFields";
import { RecipientFormInputs } from "./types";
import styles from "../Bills.module.scss";
import { BillContext } from "../context/BillContext";
import { useMutableData } from "API/useData";
import { API_URL, RECIPIENT_CHECKBOX_FIELDS, RECIPIENT_STATIC_FIELDS, RECIPIENT_TAGINPUT_FIELDS } from "../constants";
import { defineDefaultValue } from "../hooks/useRecipientFormFields/mapper";

const RecipientForm: React.FC = () => {
  const {
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext<RecipientFormInputs>();
  const { recipientSelectedID } = useContext(BillContext);

  const { data: recipientDetail } = useMutableData(
    recipientSelectedID ? `${API_URL.recipientDetail}/${recipientSelectedID}` : ""
  );

  useEffect(() => {
    if (recipientDetail) {
      const { payload } = recipientDetail?.data;
      setValue("legalName", payload.legalName);
      payload.dynamicFields.forEach((item) => {
        // list of checkbox aliases
        const checkbox = RECIPIENT_CHECKBOX_FIELDS.includes(item.alias) && "checkbox";
        const tagInput = RECIPIENT_TAGINPUT_FIELDS.includes(item.alias) && "taginput";
        const fieldType = checkbox || tagInput || "";
        const value = defineDefaultValue(fieldType, item.value);
        if (RECIPIENT_STATIC_FIELDS.includes(item.alias)) {
          setValue(item.alias, value);
        } else {
          setValue(`dynamicFields.${item.alias}`, value);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientDetail]);

  const combinationIDs = useMemo(() => {
    if (recipientDetail) {
      return recipientDetail?.data?.payload.dynamicFields.map((item) => item.id).filter(Boolean);
    }
  }, [recipientDetail]);

  useEffect(() => {
    setValue("meta.recipientDetail", recipientDetail?.data?.payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientDetail]);

  const { data: recipientDetailFields } = useRecipientDetailFields(combinationIDs);

  useEffect(() => {
    if (!recipientDetail) {
      const orgCountryCode = GetBaseAuthObject().orgCountryCode;
      setValue("countryCode", orgCountryCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientDetail]);

  const renderErrorMsg = (fieldName: string) => {
    if (errors.dynamicFields?.[fieldName]) {
      return <span className={styles.errorMessage}>{errors.dynamicFields[fieldName].message}</span>;
    } else if (errors[fieldName]) {
      return <span className={styles.errorMessage}>{errors[fieldName].message}</span>;
    } else {
      return;
    }
  };
  return (
    <>
      {recipientDetailFields.map((item) => (
        <Fragment key={item.name}>
          <FieldController
            {...item}
            // disabled when field fetching additional dynamic fields
            fieldProps={{
              ...item.fieldProps,
              disabled: item.fieldProps?.disabled || getValues("meta.isLoadingField") === item.name,
            }}
          />
          {renderErrorMsg(item.alias || item.name)}
        </Fragment>
      ))}
    </>
  );
};

export default RecipientForm;
