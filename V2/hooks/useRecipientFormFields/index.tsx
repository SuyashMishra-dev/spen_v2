import { useMutableData } from "API/useData";
import qs from "query-string";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FieldGenerator } from "../../BillForm/type";
import { CustomFieldType, FieldType } from "../../components/FormGenerator/type";
import { API_URL, VALIDATION_MSG } from "../../constants";
import { getResponsePayload } from "../../utilities";
import { formFieldsMapper, getParents, orderFields, removeDuplicatesFields } from "./mapper";
import { DynamicFormField } from "./types";
import { BillContext } from "../../context/BillContext";
import { useBillForm } from "../../context/FormContext";
import { checkVendorNameAvailability } from "Redux/DataCalls/Disbursement.api";
import { RecipientFormInputs } from "../../Recipient/types";

/**
 * This hooks is a dynamic fields generator that created
 * to prepare the possibilities of moving this to the
 * BE when it becoming too complex.
 * PRETEND THAT THIS IS AN API RESPONSE
 * @param body an object filled with conditions for adding/removing fields
 * @returns formFields used for BillDetail form
 */
const getRecipientDetailFields = (isEdit?: boolean) => {
  const checkVendorNameValidator = async (legalName: string) => {
    if (isEdit) {
      return true;
    }
    try {
      await checkVendorNameAvailability(legalName);
      return true;
    } catch (error) {
      return VALIDATION_MSG.duplicateRecipientName;
    }
  };

  const fields: FieldGenerator[] = [
    {
      label: "Recipient",
      name: "legalName",
      rules: {
        required: VALIDATION_MSG.required("Recipient"),
        validate: checkVendorNameValidator,
      },
      fieldProps: {
        fieldType: FieldType.INPUT,
        placeholder: "Enter Recipient Name",
        description: "Recipient will be saved under this nickname that is only visible to your organization.",
      },
    },
    {
      label: "Recipient Bank Account Name",
      name: "beneficiaryName",
      rules: {
        required: VALIDATION_MSG.required("Recipient Bank Account Name"),
      },
      fieldProps: {
        fieldType: FieldType.INPUT,
        placeholder: "Enter Recipient Bank Account Name",
      },
    },
    {
      label: "Recipient Country and Currency",
      name: "countryAndCurrency",
      tooltip: "The currency defined here will be the currency received by recipient",
      fieldGroup: [
        {
          name: "countryCode",
          rules: {
            required: VALIDATION_MSG.required("Recipient Country"),
          },
          fieldProps: {
            fieldType: CustomFieldType.RECIPIENT_COUNTRY_SELECT,
          },
        },
        {
          name: "currencyCode",
          rules: {
            required: VALIDATION_MSG.required("Recipient Currency"),
          },
          fieldProps: {
            fieldType: CustomFieldType.RECIPIENT_CURRENCY_SELECT,
          },
        },
      ],
    },
  ];

  return {
    data: {
      payload: {
        fields,
      },
    },
  };
};

/**
 * Will replace it with the real API
 * @returns swr object like
 */
export const useRecipientDetailFields = (combinationIDs?: number[]) => {
  const [dynamicFields, setDynamicFields] = useState([]);
  const [latestUpdateField, setLatestUpdateField] = useState<Record<"key" | "value", string> | undefined>(undefined);

  // only use combinationIDs once
  const [initialFetchEdit, setInitialFetchEdit] = useState(Boolean(combinationIDs));

  // request key that generated the first time we request dynamic form fields
  const [requestKey, setRequestKey] = useState("");

  const { dynamicFieldsIdentifier, setDynamicFieldsIdentifier } = useContext(BillContext);
  const { watch, getValues, unregister, setValue } = useFormContext<RecipientFormInputs>();
  const { refetchValues } = useBillForm();
  const [countryCode, currencyCode, legalName, recipientDetail] = watch([
    "countryCode",
    "currencyCode",
    "legalName",
    "meta.recipientDetail",
  ]);

  const staticFields = useMemo(() => {
    const isEdit = recipientDetail?.legalName === legalName;
    const { fields } = getResponsePayload(getRecipientDetailFields(isEdit)) || {};
    return fields;
  }, [legalName, recipientDetail?.legalName]);

  // to remove chain fields by their parent
  const chainHistory = useMemo(() => {
    return getParents(dynamicFields);
  }, [dynamicFields]);

  // Used by: RecipientBankSelect
  const isNewData = refetchValues?.[latestUpdateField?.key]?.isNewData;

  // to get latest update field
  useEffect(() => {
    const subscription = watch((formValue, { name, type }) => {
      if (type === "change") {
        const keys = name.split(".");
        const fieldValue = keys.reduce((acc, currKey) => acc[currKey], formValue);
        setLatestUpdateField({ key: name, value: fieldValue });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // to help us get information about the dynamic fields identifier
  useEffect(() => {
    setDynamicFieldsIdentifier(
      dynamicFields.reduce((prev, curr) => {
        return {
          ...prev,
          [curr.name]: {
            id: curr.id,
            fieldID: curr.fieldID,
            isOnChangeRefetch: curr.fieldProps.isOnChangeRefetch,
          },
        };
      }, {})
    );
  }, [dynamicFields, setDynamicFieldsIdentifier]);

  // list of fields that have additional fields
  const chainFields = useMemo(() => {
    return Object.entries(dynamicFieldsIdentifier)
      .filter(([_, value]) => value.isOnChangeRefetch)
      .reduce((prev, [key, value]) => {
        const newFieldIdentifier = {
          ...prev,
          [key]: value,
        };

        return newFieldIdentifier;
      }, {} as typeof dynamicFieldsIdentifier);
  }, [dynamicFieldsIdentifier]);

  useEffect(() => {
    if (dynamicFields.length) {
      // reset dynamic fields when the country or currency changes
      setDynamicFields([]);
      setLatestUpdateField(undefined);
      Object.keys(dynamicFieldsIdentifier).forEach((key) => {
        // TO DO: give correct type for the key if possible
        unregister(key as any);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, currencyCode]);

  const getFieldValue = useCallback(
    (key) => {
      const value = getValues(key);
      if (typeof value === "boolean") {
        // for checkbox
        return value ? "1" : "0";
      }
      return value;
    },
    [getValues]
  );

  // chain fields params
  const refetchParams = useMemo(() => {
    if (!chainFields[latestUpdateField?.key] || initialFetchEdit) {
      return;
    }

    const fieldValue = getFieldValue(latestUpdateField.key);
    return {
      fieldID: chainFields[latestUpdateField.key].fieldID,
      fieldValue: isNewData ? undefined : fieldValue,
      key: requestKey,
      isNewData,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainFields, isNewData, getFieldValue, latestUpdateField, requestKey]);

  const recipientFieldsURL = useMemo(() => {
    if (!currencyCode || !countryCode) {
      return null;
    }
    return qs.stringifyUrl({
      url: API_URL.recipientFields,
      query: {
        ...refetchParams,
        currency: currencyCode,
        destinationCountry: countryCode,
        combinationIDs: initialFetchEdit ? combinationIDs : undefined,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, currencyCode, refetchParams, combinationIDs]);

  const { data: dynamicFieldsData, isLoading } = useMutableData(recipientFieldsURL, {
    revalidateOnFocus: false,
    onSuccess: (data) => {
      setRequestKey(data.data.payload.key);
      if (initialFetchEdit) setInitialFetchEdit(false);
    },
  });

  useEffect(() => {
    const { fields } = getResponsePayload<{ fields: DynamicFormField[] }>(dynamicFieldsData) || {};
    if (fields) {
      // when the field has doFetch true and type is option (radio),
      // trigger fetch child fields by setting the latest update field with the initial chain field
      const initialChainField = fields.find((item) => item.fieldProps.doFetch && item.type === "option");
      if (initialChainField && latestUpdateField?.key === undefined) {
        setLatestUpdateField({
          key: `dynamicFields.${initialChainField.alias}`,
          value: initialChainField.value,
        });
      }

      setDynamicFields((prev) => orderFields(removeDuplicatesFields([...prev, ...formFieldsMapper(fields)])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicFieldsData]);

  // remove the child fields when the parent field is changed.
  useEffect(() => {
    // when isNewData is true, it should not delete the new added field
    if (!chainFields[latestUpdateField?.key] || isNewData) {
      return;
    }

    const affectedFields = Object.entries(chainHistory)
      // find the child fields
      .filter(([_, value]) => value.includes(latestUpdateField?.key.replace("dynamicFields.", "")))
      .map(([key]) => key);

    // reset affected fields values
    affectedFields.forEach((key) => unregister(`dynamicFields.${key}`));

    // remove the child fields
    setDynamicFields((prev) => prev.filter((item) => !affectedFields.includes(item.alias)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestUpdateField, isNewData]);

  // loading handler for chain field when fetching
  useEffect(() => {
    if (isLoading && latestUpdateField?.key && dynamicFieldsIdentifier[latestUpdateField.key]?.isOnChangeRefetch) {
      setValue("meta.isLoadingField", latestUpdateField?.key);
    } else {
      setValue("meta.isLoadingField", undefined);
    }
  }, [dynamicFieldsIdentifier, isLoading, latestUpdateField?.key, setValue]);

  return { data: [...staticFields, ...dynamicFields], isLoading };
};
