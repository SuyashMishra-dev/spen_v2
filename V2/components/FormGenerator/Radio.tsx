import React from "react";
import { Radio as AntdRadio } from "antd";
import { RadioProps } from "antd/lib/radio";
import { FieldConsumerType } from "../../BillForm/type";

const Radio: React.FC = (props: RadioProps & FieldConsumerType) => {
  return <AntdRadio.Group {...props} />;
};

export default Radio;
