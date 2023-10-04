import React, { useMemo } from "react";
import qs from "query-string";
import { SelectProps } from "antd/lib/select";

import Select from "../Select";
import { useMutableData } from "API/useData";

import { API_URL } from "../../../constants";
import { TAX_STATUS } from "constants/Tax.constant";
import { roundValue } from "utility";

const Tax = (props: SelectProps<any>) => {
  const apiUrl = qs.stringifyUrl({
    url: API_URL.tax,
    query: {
      status: TAX_STATUS.ACTIVE,
    },
  });
  const { data, isValidating } = useMutableData(apiUrl);

  const taxList = useMemo(() => {
    if (data?.data?.payload?.data?.length) {
      return data?.data?.payload?.data.map((tax) => {
        return {
          value: tax.id,
          label: `${tax.tax_name} ${roundValue(tax.tax_rate)}%`,
        };
      });
    }

    return [];
  }, [data?.data]);

  return (
    <Select
      {...props}
      showSearch
      loading={isValidating}
      filterOption={(input, option) => String(option?.label)?.toLowerCase().includes(input.toLowerCase())}
      options={taxList}
    />
  );
};

export default Tax;
