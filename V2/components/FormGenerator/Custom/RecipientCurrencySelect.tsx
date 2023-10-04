import React, { useEffect, useMemo } from "react";

import qs from "query-string";
import { useFormContext } from "react-hook-form";

import { useMutableData } from "API/useData";
import { API_URL } from "Views/Bills/V2/constants";
import { getResponsePayload } from "Views/Bills/V2/utilities";
import { RecipientFormInputs } from "Views/Bills/V2/Recipient/types";

import Select from "../Select";
import { vendorDynamicFieldNames } from "../type";

// TODO: create interface for the props
const RecipientCurrencySelect = (props: any) => {
  const { getValues, setValue, watch } = useFormContext<RecipientFormInputs>();
  const countryCode = watch(vendorDynamicFieldNames.countryCode);

  const currencyListURL = qs.stringifyUrl({
    url: API_URL.currencyList,
    query: {
      filterBy: "org",
      recipientCountry: countryCode?.substring(0, 2),
    },
  });

  const { data } = useMutableData(currencyListURL);
  const options = useMemo(
    () =>
      (getResponsePayload(data) as any)?.result?.map((item) => ({
        value: item.CurrencyCode,
        label: item.CurrencyCode,
      })) || [],
    [data]
  );

  useEffect(() => {
    if (options.length) {
      const option = options.find((item) => item.value.substring(0, 2) === countryCode);
      if (!getValues("meta.recipientDetail")) {
        setValue(vendorDynamicFieldNames.currencyCode, option?.value);
      }
    }
  }, [countryCode, getValues, options, setValue]);

  return <Select {...props} options={options} defaultValue={options[0]?.value} />;
};

export default RecipientCurrencySelect;
