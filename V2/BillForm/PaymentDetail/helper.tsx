import React from "react";
import FormGenerator from "../../components/FormGenerator";
import { CustomFieldType } from "../../components/FormGenerator/type";
import { BillFieldGenerator, FieldGenerator } from "../type";

/**
 * Helper function is created to render multiple fields inside
 * 1 Component. The idea is to use your own FormGenerator
 * and separate the props for each field inside the Component.
 * @param fieldList Array of field list
 * @returns array of fields
 */
export const generatePaymentDetailFields = (fieldList: FieldGenerator[] = []) => {
  const fields = fieldList.map((field: FieldGenerator) => {
    const data: BillFieldGenerator = { ...field };
    const { name } = data;

    if ("fieldGroup" in data) {
      switch (name) {
        case "twoWayPayment":
          {
            // Hard coded for invoice amount by
            // transforming the field
            const [recipientGet, youPay, swiftPaymentChargeType] = data.fieldGroup;
            data.name = recipientGet.name;
            data.rules = {
              required: true,
            };

            // custom render
            data.render = ({ field }) => {
              // TO DO: is it better to not use render from the controller?
              const { name, onChange, value } = field;

              return (
                <FormGenerator
                  fieldType={CustomFieldType.TWO_WAY_PAYMENT}
                  recipientGetProps={{
                    ...recipientGet,
                    // get the controller from the FormController
                    name,
                    value,
                    onChange,
                  }}
                  youPayProps={{
                    ...youPay,
                    controllerProps: { name: youPay.name, rules: youPay.rules },
                  }}
                  swiftPaymentProps={{
                    ...swiftPaymentChargeType,
                    controllerProps: {
                      name: swiftPaymentChargeType.name,
                      rules: swiftPaymentChargeType.rules,
                    },
                  }}
                />
              );
            };
          }
          break;
        case "paymentScheduleDate": {
          const [dateField, checkboxField] = data.fieldGroup;
          data.render = ({ field, fieldState, formState }) => {
            // TO DO: is it better to not use render from the controller?
            const { name, onChange, value } = field;

            return (
              <FormGenerator
                fieldType={CustomFieldType.PAYMENT_SCHEDULE}
                dateFieldProps={{
                  ...dateField,
                  // get the controller from the FormController
                  name,
                  value,
                  onChange,
                }}
                checkboxFieldProps={{
                  ...checkboxField,
                }}
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
