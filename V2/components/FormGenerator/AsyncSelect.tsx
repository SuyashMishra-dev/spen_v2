import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Select as AntSelect } from "antd";
import { SelectProps } from "antd/lib/select";
import { useMutableData } from "API/useData";

export interface AsyncSelectProps extends SelectProps<any> {
  fetchUrl?: string;
  fetchResultParser?: (data: any) => { label: string; value: string }[];
}

const AsyncSelect = forwardRef(({ fetchUrl, fetchResultParser, ...props }: AsyncSelectProps, ref) => {
  const selectRef = useRef(null);
  useImperativeHandle(ref, () => selectRef.current);

  const { data } = useMutableData(fetchUrl);
  const options = fetchResultParser?.(data) || [];

  return <AntSelect ref={selectRef} {...props} options={options as any} defaultValue={options?.[0]?.value} />;
});

export default AsyncSelect;
