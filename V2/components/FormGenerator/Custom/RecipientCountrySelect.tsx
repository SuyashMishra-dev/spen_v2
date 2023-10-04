import React from "react";

import { useMutableData } from "API/useData";
import CountrySelectComponent from "Modules/CountrySelect";
import { API_URL } from "Views/Bills/V2/constants";
import qs from "query-string";

// TODO: create interface for the props
const RecipientCountrySelect = (props: any) => {
  const countryListURL = qs.stringifyUrl({
    url: API_URL.countryList,
    query: {
      filterBy: "org",
      showFrequentlyUsed: false,
    },
  });

  const { data: countryList } = useMutableData(countryListURL);

  return <CountrySelectComponent {...props} countryList={countryList?.data?.payload?.countries || []} />;
};

export default RecipientCountrySelect;
