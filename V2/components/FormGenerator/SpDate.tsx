import React from "react";
import dayjs from "dayjs";
import SpDatePicker from "Modules/SpDatePicker";

import { PickerDateProps } from "antd/lib/date-picker/generatePicker";

const Date = (props: PickerDateProps<any>) => {
  const { value, onChange, ...rest } = props;

  const handleChange = (date, dateString) => {
    onChange(dayjs(date).format("YYYY-MM-DD"), dateString);
  };
  return <SpDatePicker defaultDate={value} onChange={handleChange} {...rest} />;
};

export default Date;
