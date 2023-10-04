import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { SelectProps } from "antd/lib/select";

import { useMutableData } from "API/useData";
import Select from "../Select";

import { API_URL } from "../../../constants";
import { GetBaseAuthObject } from "utility";
import { useFormContext } from "react-hook-form";

interface CategoryOption {
  value: number;
  label: string;
  taxid: string;
}

const Category = forwardRef((props: SelectProps<any>, ref) => {
  const { onSelect, ...rest } = props;
  const selectRef = useRef(null);
  useImperativeHandle(ref, () => selectRef.current);
  const { setValue } = useFormContext();

  const { data, isValidating } = useMutableData(
    `${API_URL.userInfo}/${GetBaseAuthObject().userId}?organisation_id=${GetBaseAuthObject().orgId}`
  );

  const categories = useMemo(() => {
    if (data?.data?.payload?.categories?.length) {
      return data?.data?.payload?.categories.map((category) => {
        return {
          value: category.id,
          label: category.category_name,
          // custom attributes must be lowercase, this is warning from antd
          taxid: category.tax_id,
        } as CategoryOption;
      });
    }

    return [];
  }, [data?.data]);

  const selectTax = (_value: any, option: CategoryOption) => {
    setValue("taxID", option.taxid);
  };

  return (
    <Select
      ref={selectRef}
      {...rest}
      showSearch
      loading={isValidating}
      filterOption={(input, option) => String(option?.label)?.toLowerCase().includes(input.toLowerCase())}
      options={categories}
      onSelect={selectTax}
    />
  );
});

export default Category;
