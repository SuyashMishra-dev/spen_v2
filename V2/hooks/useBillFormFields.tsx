import useSWR, { SWRConfiguration } from "swr";
import qs from "query-string";

import { useMutableData } from "API/useData";

import { getCookieValue, cookieNames } from "utility/CookieHelper";
import { CustomFieldType, FieldType, vendorDynamicFieldNames } from "../components/FormGenerator/type";
import { FieldGenerator } from "../BillForm/type";
import { API_URL } from "../constants";
import { GetBaseAuthObject } from "utility";

/**
 * This hooks is a dynamic fields generator that created
 * to prepare the possibilities of moving this to the
 * BE when it becoming too complex.
 * PRETEND THAT THIS IS AN API RESPONSE
 * @param body an object filled with conditions for adding/removing fields
 * @returns formFields used for BillDetail form
 */
const getBillDetailFields = async ([url, step, vendorDetailPayload]: any[]) => {
  const parsedUrl = qs.parseUrl(url, { parseBooleans: true });
  const { addNotes, isConnectedWithXero, countryCode } = parsedUrl.query || {};

  let vendorCountryCode = countryCode;
  let vendorCurrencyCode;

  if (vendorDetailPayload?.dynamicFields) {
    vendorCountryCode = vendorDetailPayload?.dynamicFields.find((item) => {
      return item.alias === vendorDynamicFieldNames.countryCode;
    })?.value;
    vendorCurrencyCode = vendorDetailPayload?.dynamicFields.find((item) => {
      return item.alias === vendorDynamicFieldNames.currencyCode;
    })?.value;
  }

  const isPHCompany = countryCode === "PH";

  const fields: FieldGenerator[] = [
    {
      label: "Recipient",
      name: "vendorID",
      rules: {
        required: true,
      },
      fieldProps: {
        fieldType: CustomFieldType.RECIPIENT_SELECT,
        isOnChangeRefetch: true,
        resetFields: ["addNotes", "billTax.invoiceCurrency"],
      },
    },
    {
      label: "Invoice Number",
      name: "billNumber",
      fieldProps: {
        fieldType: FieldType.INPUT,
        placeholder: "Enter invoice number",
      },
    },
    {
      name: "issuanceDueDate",
      fieldGroup: [
        {
          label: "Issuance Date",
          name: "issuedDate",
          fieldProps: {
            fieldType: FieldType.DATE,
            placeholder: "Select a date",
            hasClear: true,
          },
        },
        {
          label: "Due Date",
          name: "dueDate",
          fieldProps: {
            fieldType: CustomFieldType.DATE_LIST,
            placeholder: "Select a date",
            refField: "issuedDate",
          },
        },
      ],
    },
    {
      label: "Category",
      name: "expenseCategoryID",
      rules: {
        required: false,
      },
      fieldProps: {
        fieldType: CustomFieldType.CATEGORY,
        placeholder: "Select category",
      },
    },
    {
      label: "Tax",
      name: "taxID",
      rules: {
        required: isPHCompany,
      },
      fieldProps: {
        fieldType: CustomFieldType.TAX,
        placeholder: "Select tax",
      },
    },
    {
      label: "Invoice Amount",
      name: "currencyInvoiceAmount",
      fieldGroup: [
        {
          name: "billTax.invoiceCurrency",
          rules: {
            required: true,
          },
          fieldProps: {
            fieldType: FieldType.SELECT,
            /* get from fieldProps because
            the CurrencyInput can be broken down
            into 2 fieldGroup */
            countryCode: vendorCountryCode,
            currencyCode: vendorCurrencyCode,
          },
        },
        {
          name: "billTax.invoiceAmount",
          rules: {
            required: true,
          },
          fieldProps: {
            fieldType: FieldType.INPUT,
            placeholder: "Enter amount",
            isOnChangeRefetch: true,
          },
        },
      ],
    },
    {
      name: "addNotes",
      defaultValue: false,
      fieldProps: {
        fieldType: FieldType.CHECKBOX,
        textLabel: isConnectedWithXero ? "Add tags and notes" : "Add notes",
        isOnChangeRefetch: true,
        resetFields: [...(!addNotes ? ["notes"] : []), ...(!addNotes && isConnectedWithXero ? ["tags"] : [])],
      },
    },
  ];

  if (Boolean(addNotes)) {
    if (isConnectedWithXero) {
      const tags = {
        label: "Tags",
        name: "tags",
        fieldProps: {
          fieldType: CustomFieldType.TAGS,
          placeholder: "Select tags",
        },
      };

      fields.push(tags);
    }

    const notes = {
      label: "Notes",
      name: "notes",
      fieldProps: {
        fieldType: FieldType.INPUT,
        placeholder: "Write a note for your team",
      },
    };

    fields.push(notes);
  }

  return {
    data: {
      payload: {
        step: 1,
        next: 2,
        title: undefined,
        fields,
      },
    },
  };
};

/**
 * This hooks is a dynamic fields generator that created
 * to prepare the possibilities of moving this to the
 * BE when it becoming too complex.
 * PRETEND THAT THIS IS AN API RESPONSE
 * @param body an object filled with conditions for adding/removing fields
 * @returns formFields used for PaymentDetail form
 */
const getPaymentDetailFields = ([url]: string[]) => {
  const parsedUrl = qs.parseUrl(url, { parseBooleans: true });
  const { countryCode, youPayAmount } = parsedUrl.query || {};

  const isMoreThan500 = countryCode === "PH" && Number(youPayAmount) >= 500000;

  const fields: FieldGenerator[] = [
    {
      name: "twoWayPayment",
      fieldGroup: [
        {
          label: "Recipient gets",
          name: "amount",
          tooltip:
            "Recipient currency is determined by the saved recipient details. Edit the recipient details to change the currency.",
          rules: {
            required: true,
          },
          fieldProps: {
            fieldType: CustomFieldType.TWO_WAY_PAYMENT,
            placeholder: "Enter amount",
          },
        },
        {
          label: "You pay",
          name: "youPayAmount",
          rules: {
            required: true,
          },
          fieldProps: {
            fieldType: CustomFieldType.TWO_WAY_PAYMENT,
            placeholder: "Enter amount",
            isOnChangeRefetch: countryCode === "PH",
          },
        },
        {
          name: "swiftPaymentChargeType",
          defaultValue: "SHA",
          fieldProps: {
            fieldType: CustomFieldType.TWO_WAY_PAYMENT,
          },
        },
      ],
    },
    {
      name: "paymentScheduleDate",
      fieldGroup: [
        {
          name: "paymentScheduleDate",
          label: "Payment Scheduled On",
          rules: {
            required: "Select a due date to enable payment date suggestion",
          },
          fieldProps: {
            fieldType: CustomFieldType.PAYMENT_SCHEDULE,
            placeholder: "Select a date",
            hasClear: false,
            help: "ETA within",
          },
        },
        {
          name: "suggestDateCheckbox",
          label: "Suggest me a payment date",
          rules: {
            required: false,
          },
          fieldProps: {
            fieldType: CustomFieldType.PAYMENT_SCHEDULE,
          },
        },
      ],
    },
    {
      label: "Pay from",
      name: "walletID",
      rules: {
        required: true,
      },
      fieldProps: {
        fieldType: CustomFieldType.PAY_FROM,
        placeholder: "Enter Pay from",
      },
    },
    {
      label: "Remark for Recipient",
      name: "remarksForRecipient",
      rules: {
        required: false,
      },
      fieldProps: {
        fieldType: FieldType.INPUT,
        placeholder: "Enter remarks",
        description: "Remarks will be shown on receipt and recipient's bank statement",
      },
    },
    {
      label: "Send Payment Updates to",
      name: "sendPaymentUpdatesTo",
      rules: {
        required: false,
      },
      fieldProps: {
        fieldType: FieldType.INPUTTAG, // TO DO: should change to CustomType for email validation
        placeholder: "Enter emails",
        description: "Send payment notification to these email(s) when the payment is done",
      },
    },
    {
      label: "Attachment",
      name: "additionalAttachments",
      rules: {
        required: false,
      },
      fieldProps: {
        fieldType: CustomFieldType.ATTACHMENT,
      },
    },
  ];

  return {
    data: {
      payload: {
        step: 2,
        next: isMoreThan500 ? 3 : undefined, // 3 (if additional is exists) or undefined
        title: undefined,
        fields,
      },
    },
  };
};

const getAdditionalFields = () => {
  // currently only for PH
  const fields: FieldGenerator[] = [
    {
      label: "Recipient Address",
      name: "benificiaryAddress",
      rules: {
        required: true,
        maxLength: 255,
      },
      fieldProps: {
        fieldType: FieldType.TEXT_AREA,
        placeholder: "Enter Recipient Address",
        maxLength: 255,
        showCount: true,
        autoSize: { minRows: 4, maxRows: 4 },
      },
    },
  ];

  return {
    data: {
      payload: {
        step: 3,
        next: undefined,
        title: "Additional transfer details",
        fields: fields,
      },
    },
  };
};

/**
 * SWR-like hooks special for BillDetail
 * @returns swr object
 */
export const useBillDetailFields = (url: string | null, options?: SWRConfiguration) => {
  const orgId = GetBaseAuthObject().orgId;
  const parsedURL = { ...qs.parseUrl(url) };
  const { vendorID } = parsedURL.query || {};

  // fetch xeroAuth here since the BE have this data
  const xeroAuthURL = qs.stringifyUrl(
    {
      url: API_URL.xeroAuth,
      query: {
        organisation_id: orgId,
      },
    },
    {
      skipEmptyString: true,
    }
  );
  const { data: xeroAuth } = useMutableData(xeroAuthURL);

  const { data: vendorDetailData, error } = useMutableData(vendorID ? `${API_URL.recipientDetail}/${vendorID}` : null);

  const vendorDetailPayload = vendorDetailData?.data?.payload;

  const swr = useSWR(
    () => {
      parsedURL.query = {
        ...parsedURL.query,
        // BE should be able to get this from orgId
        isConnectedWithXero: xeroAuth.data.payload.has_valid_token || false,
      };

      if (!parsedURL.query.step) {
        throw new Error("no step in the query");
      }

      if (vendorID && error) {
        throw new Error("failed to fetch vendor detail");
      }

      const billDetailURL = qs.stringifyUrl(parsedURL);

      return [billDetailURL, String(parsedURL.query.step), vendorDetailPayload, getCookieValue(cookieNames.AUTH_TOKEN)];
    },
    (params) => {
      const step = params[1];
      switch (step) {
        case "1": {
          return getBillDetailFields(params);
        }
        case "2": {
          return getPaymentDetailFields(params);
        }
        case "3": {
          return getAdditionalFields();
        }
      }
    },
    options
  );

  return swr;
};
