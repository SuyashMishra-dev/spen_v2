import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Select as AntSelect } from "antd";
import { SelectProps } from "antd/lib/select";

const { Option } = AntSelect;

const Select = forwardRef((props: SelectProps<any>, ref) => {
  const selectRef = useRef(null);
  useImperativeHandle(ref, () => selectRef.current);

  return <AntSelect ref={selectRef} {...props} />;
});

export { Option };

export default Select;
