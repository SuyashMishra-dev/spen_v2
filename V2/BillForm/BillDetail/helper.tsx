import React from "react";
import FormGenerator from "../../components/FormGenerator";

import { CustomFieldType } from "../../components/FormGenerator/type";
import { BasicFieldGenerator, BillFieldGenerator, BillFormFields, FieldGenerator, OCRData } from "../type";
import { flattenObj } from "utility";

/**
 * Helper function is created to render multiple fields inside
 * 1 Component. The idea is to use your own FormGenerator
 * and separate the props for each field inside the Component.
 * @param fieldList Array of field list
 * @returns array of fields
 */
export const generateBillDetailFields = (
  fieldList: FieldGenerator[] = [],
  ocrData: OCRData,
  formValues: BillFormFields
) => {
  const flattenFormValues = flattenObj(formValues);

  // comparing value based on name
  const compareFieldWithOCR = (name: string) => {
    return flattenFormValues?.[name] === ocrData?.[name];
  };

  const fields = fieldList.map((field: FieldGenerator) => {
    const data: BillFieldGenerator = { ...field };
    const { name } = data;

    /**
     * Generated OCR Props is used for straightforward field
     * and for special fields (Ex: field with fieldsGroup)
     * @param name Bill details field key
     */
    const generateOCRProps = (name: string, field?: BasicFieldGenerator) => {
      // IMPROVEMENT: OCR Data should not be mapped by FE
      // rather it should be called when calling the Dynamic API
      if (ocrData && name in ocrData) {
        (field || data).withOCR = true;
        (field || data).isSameWithOCR = compareFieldWithOCR(name);

        return field;
      }
    };

    // for general data
    generateOCRProps(name);

    if ("fieldGroup" in data) {
      switch (name) {
        case "issuanceDueDate": {
          data.fieldGroup.forEach((field: BasicFieldGenerator, index: number) => {
            const { name } = field;
            const modifiedFields = generateOCRProps(name, field);
            data.fieldGroup[index] = {
              ...data.fieldGroup[index],
              ...modifiedFields,
            };
          });
          break;
        }
        case "currencyInvoiceAmount": {
          // IMPROVEMENT: don't hard code the fields

          // Hard coded for invoice amount by
          // transforming the field
          const [currency, amount] = data.fieldGroup;
          data.name = amount.name;
          data.rules = amount.rules;

          if (ocrData && amount.name in ocrData) {
            generateOCRProps(amount.name);
          }

          // custom render
          data.render = ({ field }) => {
            const { name, onChange, value } = field;
            // fieldType will be excluded from the currencyProps
            const { fieldType, ...currencyProps } = currency.fieldProps;

            return (
              <FormGenerator
                {...amount.fieldProps}
                fieldType={CustomFieldType.CURRENCY_INPUT}
                id={name}
                placeholder="Enter amount"
                selectProps={{
                  ...currencyProps,
                  controllerProps: { name: currency.name, rules: currency.rules },
                }}
                name={name}
                amount={value}
                onChangeAmount={onChange}
              />
            );
          };
        }
      }
    }

    return data;
  });
  return fields;
};
