import { CustomFieldType, FieldType } from "../../components/FormGenerator/type";

export interface DynamicFormFieldOption {
  value: string;
  label: string;
  additionalCode?: string;
}

export interface DynamicFormIdentifier {
  id: number;
  fieldID: number;
  isOnChangeRefetch: boolean;
}

export enum DynamicFormFieldType {
  checkbox = "checkbox",
  dropdown = "dropdown",
  option = "option",
  text = "text",
  textarea = "textarea",
  textfield = "textfield",
  tagInput = "tagInput",
}

export interface DynamicFormField {
  alias: string;
  fieldID: number;
  fieldProps: {
    checklist: {
      title: string;
      subtitle: string;
      default: boolean;
      hideCombinationIDs?: number[];
    } | null;
    doFetch: boolean;
    editable: boolean;
    inBSS: {
      hide: boolean;
      optional: boolean;
    };
    indentation: number;
    information: string;
    inOpsy: {
      hide: boolean;
      optional: boolean;
    };
    isAllowToAddData: boolean;
    isHideForNewData: boolean;
    hideWhenSingleOption?: boolean;
    maxChar: number;
    minChar: number;
    noteLink: string;
    noteText: string;
    parentFieldID: number;
    parentValue: string;
    placeholder: string;
    regex: string;
    regexErrorMessage: string;
    isTrimSpace: boolean;
    renderNewBank: boolean;
    required: boolean;
    similarCombinationID: number;
    staticPrefix?: string;
  };
  id: number;
  label: string;
  options: DynamicFormFieldOption[];
  type: DynamicFormFieldType;
  orderNumber: number;
  value: string;
}

export interface MappedDynamicFormFields {
  id: number;
  fieldID: number;
  name: string;
  alias: string;
  label?: string; // label will removed for checkbox
  rules: Record<string, any>;
  fieldProps: {
    fieldType: CustomFieldType | FieldType;
    tooltip: string;
    isOnChangeRefetch: boolean;
    options: { label: string; value: string }[];
    placeholder: string;
    disabled: boolean;
    textLabel?: string;
    pattern: Record<string, any>;
  };
  parentFieldID: number;
  defaultValue: boolean | string | string[];
  orderNumber: number;
}

export enum BankValidatorTypes {
  IFSC_CODE = "ifscCode",
  ACH_CODE = "achCode",
  IBAN_CODE = "ibanCode",
  BSB_CODE = "bsbCode",
  SORT_CODE = "sortCode",
}
