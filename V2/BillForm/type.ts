import { ReactElement } from "react";
import { UseControllerReturn } from "react-hook-form";

import { CustomFieldType, FieldType } from "../components/FormGenerator/type";

export type VendorDetailData = {
  dynamicFields: {
    id: number;
    alias: string;
    value?: string;
    orderNumber: number;
  }[];
  legalName: string;
  organisationID: string;
};

export interface BillFormProviderProps {
  vendorDetail?: VendorDetailData;
  setVendorDetail(vendorData: VendorDetailData): void;
  handleSaveDraft(): void;
  // to handle refetch FieldGenerator
  refetchValues?: {
    vendorID?: string;
    addNotes?: boolean;
  };
  isAmountChanged?: boolean;
  setIsAmountChanged(value: boolean): void;
  ocrData?: OCRData;
  setOCRData(value: Object): void;
  isFxRateExpired?: boolean;
  setIsFxRateExpired?(value: boolean): void;
}

export interface BillFormStepProps {
  onBack(): void;
  onNext(): void;
}

export interface BillDetailFormProps extends BillFormStepProps {
  isShowForm: boolean;
  onShowForm(): void;
}

export interface FormFooterProps {
  onClickBack(): void;
  onSubmit(): void;
  submitText: string;
  isSubmitLoading?: boolean;
}

export interface FieldConsumerType {
  isOnChangeRefetch?: boolean;
  resetFields?: string[]; // name of the fields that wanted to be reset
}

export interface BasicFieldGenerator {
  label?: string;
  name: string;
  defaultValue?: unknown;
  tooltip?: string;
  rules?: {
    [key: string]: any;
  };
  fieldProps?: {
    fieldType: keyof typeof FieldType | keyof typeof CustomFieldType;
    [key: string]: any;
  };
  withOCR?: boolean;
  isSameWithOCR?: boolean;
}
export interface FieldGroupGenerator extends BasicFieldGenerator {
  fieldGroup: BasicFieldGenerator[];
}

export type FieldGenerator = BasicFieldGenerator | FieldGroupGenerator;

export type BillFieldGenerator =
  | (BasicFieldGenerator & {
      className?: string;
      render?(props: UseControllerReturn): ReactElement;
    })
  | (Omit<FieldGroupGenerator, "fieldGroup"> & {
      render?(props: UseControllerReturn): ReactElement; // field render
      fieldGroup: (BasicFieldGenerator & {
        className?: string;
        render?(props: UseControllerReturn): ReactElement; // sub field render
      })[];
    });

export enum BillFieldNames {
  invoiceAmount = "billTax.invoiceAmount",
  invoiceCurrency = "billTax.invoiceCurrency",
}

export type BillFormFields = {
  vendorID: Number;
  billNumber: string; // invoice number
  issuedDate: string;
  dueDate: string;
  expenseCategoryID: string;
  taxID: string;
  tags: string; // this should be string[]
  notes: string;
  amount: Number;
  currency: string;
  youPayCurrency: string;
  youPayAmount: Number;
  paymentScheduleTime: string;
  paymentPurpose: string;
  receiptEmailRecipients: string; // this should be string[]
  additionalAttachments: File[];
  source: "portal_single" | "portal_drag_and_drop" | "portal_xero";
  billTax: {
    invoiceAmount: Number;
    invoiceCurrency: string;
    taxRate: Number;
    vatRate: Number;
    vatAmount: Number;
    whtAmount: Number;
    hasManualWHT: boolean;
  };
  walletID: string;
};

export interface OCRData {
  ocrID: string;
  vendorID?: number;
  billNumber?: string;
  issuedDate?: string;
  dueDate?: string;
  isSameWithOCR: boolean;
  amount?: number;
  ocrData?: Record<string, any>;
}
