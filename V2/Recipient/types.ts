export type RecipientFormInputs = {
  legalName: string;
  countryCode: string;
  currencyCode: string;
  dynamicFields: {
    [key: string]: any;
  };
  // Use meta like context for form. This key will omitted on submit.
  meta: {
    recipientDetail?: Record<string, any>;
    isLoadingField?: string; // field name
  };
};
