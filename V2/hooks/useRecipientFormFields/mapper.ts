import { CustomFieldType, FieldType } from "../../components/FormGenerator/type";
import { VALIDATION_MSG } from "../../constants";
import { BankValidatorTypes, DynamicFormField, MappedDynamicFormFields } from "./types";

const transformFieldType = (type: string, fieldName?: string): FieldType | CustomFieldType => {
  switch (type) {
    case "dropdown":
      if (fieldName === "beneficiaryBankName") {
        return CustomFieldType.RECIPIENT_BANK_SELECT;
      }
      return FieldType.SELECT;

    case "checkbox":
      return FieldType.CHECKBOX;

    case "option":
      return FieldType.RADIO;

    case "taginput":
      return FieldType.INPUTTAG;

    case "textfield":
      switch (fieldName) {
        case BankValidatorTypes.ACH_CODE:
        case BankValidatorTypes.IFSC_CODE:
        case BankValidatorTypes.BSB_CODE:
        case BankValidatorTypes.IBAN_CODE:
        case BankValidatorTypes.SORT_CODE:
          return CustomFieldType.BANK_VALIDATION;
        default:
          return FieldType.INPUT;
      }
    default:
    case "text":
      return FieldType.INPUT;
  }
};

export const orderFields = (arr: any[]) => {
  return arr.sort((a, b) => {
    if (a.orderNumber < b.orderNumber) {
      return -1;
    } else if (a.orderNumber > b.orderNumber) {
      return 1;
    } else {
      return 0;
    }
  });
};

export const removeDuplicatesFields = (fields: any[]) => {
  const uniqueKeys = {};
  const result = [];

  for (const item of fields) {
    uniqueKeys[item.name] = item;
  }

  for (const key in uniqueKeys) {
    result.push(uniqueKeys[key]);
  }

  return result;
};

export const getParents = (fields: MappedDynamicFormFields[]): Record<string, string[]> => {
  // The function that return result recursively
  const getAllParents = (item: MappedDynamicFormFields, fieldMap: Record<string, MappedDynamicFormFields>) => {
    if (item?.parentFieldID) {
      const parent = fieldMap[item.parentFieldID];
      return parent?.alias ? [parent.alias].concat(getAllParents(parent, fieldMap)) : [];
    }
    return [];
  };

  // Change the structure of object to dictionary for O(1) access
  const fieldMap = fields.reduce((obj, item) => {
    obj[item.fieldID] = item;
    return obj;
  }, {});

  // The output result
  let result = {};
  fields.forEach((item) => {
    const parents = getAllParents(item, fieldMap);
    result[item.alias] = parents.reverse();
  });

  return result;
};

export const defineDefaultValue = (fieldType: string, value: string) => {
  switch (fieldType) {
    case "checkbox":
      return Boolean(value);

    case "taginput":
      return value ? value.split(",") : undefined;

    default:
      // empty string in value will be handle as undefined
      return value || undefined;
  }
};

export const formFieldsMapper = (fields: DynamicFormField[]) => {
  return fields
    .filter((field) => !field?.fieldProps?.inBSS?.hide)
    .map((field) => {
      const pattern: Record<string, any> = {
        message: field.fieldProps.regexErrorMessage,
        value: new RegExp(field.fieldProps.regex),
      };
      const mappedField: MappedDynamicFormFields = {
        id: field.id,
        fieldID: field.fieldID,
        name: `dynamicFields.${field.alias}`,
        alias: field.alias,
        label: field.label,
        rules: {
          required: field.fieldProps.required,
          maxLength: {
            message: VALIDATION_MSG.maxLength(field.label, field.fieldProps.maxChar),
            value: field.fieldProps.maxChar,
          },
          pattern,
        },
        fieldProps: {
          fieldType: transformFieldType(field.type, field.alias),
          tooltip: field.fieldProps.information,
          isOnChangeRefetch: field.fieldProps.doFetch,
          options: field.options,
          placeholder: field.fieldProps.placeholder,
          disabled: !field.fieldProps.editable,
          pattern,
        },
        parentFieldID: field.fieldProps.parentFieldID,
        defaultValue: defineDefaultValue(field.type, field.value),
        orderNumber: field.orderNumber,
      };

      if (field.type === "checkbox") {
        mappedField.label = undefined;
        mappedField.fieldProps.textLabel = field.label;
      }

      return mappedField;
    });
};
