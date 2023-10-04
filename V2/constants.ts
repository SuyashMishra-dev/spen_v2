import { urlParamsBuilder } from "utility/APIWrapper";

export const TAB_LIST = [
  // TODO: change to all bills page when it's ready
  {
    tabKey: "0",
    title: "Bill Payments",
    pathname: "/bills",
    link: "/bills", // bug for :form?
  },
  {
    tabKey: "1",
    title: "Manage Drafts",
    pathname: "/bills/drafts/:form?",
    link: "/bills/drafts",
  },
  {
    tabKey: "2",
    title: "Manage Recipients",
    pathname: "/bills/recipients/:form?",
    link: "/bills/recipients",
  },
];

export const ALLOWED_FILE_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"];

// Used to accept props in the uploader.
export const ALLOWED_FILE_EXTENSIONS_FORMATTED = ALLOWED_FILE_EXTENSIONS.map((item) => `.${item}`).join(",");

export const MAX_FILE_SIZE_ALLOWED_IN_MB = 10;
export const MAX_FILE_SIZE_ALLOWED = MAX_FILE_SIZE_ALLOWED_IN_MB * 1024 * 1024; // 10MB

// Up to 30 invoice (1 invoice = 1 bill)
export const MAX_ALLOWED_FILE_UPLOAD = 30;

export const VALIDATION_MSG = {
  maxLength: (fieldLabel: string, value: number) => `${fieldLabel} cannot exceed ${value} characters.`,
  required: (fieldLabel: string) => `${fieldLabel} cannot be empty`,
  duplicateRecipientName: "This recipient name has been taken. Use another name instead.",
};

export type BillParams = {
  form: BillFormType;
};

export enum BillFormType {
  NEW_BILL = "new-bill",
}

export enum API_URL {
  // general
  org = "/api/v1/org",
  userInfo = "/api/v1/user/info",
  xeroAuth = "/api/v1/auth/xero/check",
  tax = "/api/v1/tax",
  // disbursement
  recipientDetail = "/ms/spm-disbursement/v2/vendor",
  recipientPreview = "/ms/spm-disbursement/v3/vendor/preview",
  saveRecipient = "/ms/spm-disbursement/v2/vendor",
  currency = "/ms/spm-disbursement/v1/master/currency",
  recipientList = "/ms/spm-disbursement/v1/vendor",
  saveAsDraft = "/ms/spm-disbursement/v1/bill/draft",
  billDetailFields = "https://spenmo.com/api/bill-fields", // dummy for SWR
  countryList = "/ms/spm-disbursement/v1/master/country",
  currencyList = "/ms/spm-disbursement/v1/master/currency",
  recipientFields = "/ms/spm-disbursement/v1/bill/form-fields",
  getRecipientAmount = "/ms/spm-disbursement/v1/bill/calculate-recipient-amount",
  schedulePayment = "/ms/spm-disbursement/v1/sla",
  getBillFee = "/ms/spm-disbursement/v2/bill/corridor-simulator",
  extractOCR = "/ms/spm-disbursement/v2/ocr/extract",
  draftUpload = "/ms/spm-disbursement/v1/bill/draft/upload",
  submitBill = "/ms/spm-disbursement/v2/bill/single"
}

export const TEAMS_PAGE_URL = "/teams";

export const TRANSACTIONS_PAGE = (subtab) => urlParamsBuilder("/transactions", { tab: "pending", subtab });

export const TEAM_LIMIT_EXCEEDED = {
  YES: "yes",
  NO: "no",
  PARTIAL: "partial",
};

export const DATE_FORMAT = {
  standard: "YYYY-MM-DD",
  short: "DD MMM YYYY",
};

export const RECIPIENT_STATIC_FIELDS = ["currencyCode", "countryCode", "beneficiaryName"];
export const RECIPIENT_CHECKBOX_FIELDS = ["beneficiaryAdditionalBankIdentifierFlag"];
export const RECIPIENT_TAGINPUT_FIELDS = ["recipientEmail"];

export const DEFAULT_ERROR_MESSAGE = "An error has occured. Please try again.";

// Note: If fx rates get expired, then we get this error code
export const FX_RATE_EXPIRED_CODE = 4039;