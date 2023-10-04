import React from "react";
import { Input as AntInput } from "antd";

import { InputProps } from "antd/lib/input";

const Input = (props: InputProps) => {
  return <AntInput {...props} />;
};

export default Input;
