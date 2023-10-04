import React from "react";
import moment from "moment";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import utc from "dayjs/plugin/utc";
import { PickerDateProps } from "antd/lib/date-picker/generatePicker";

import { DATE_FORMAT } from "../../constants";

import style from "./Date.module.scss";

// This is a workaround to resolve bug from antd and dayjs interaction
// ref: https://github.com/react-component/picker/issues/123
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localeData from "dayjs/plugin/localeData";
import weekday from "dayjs/plugin/weekday";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekYear from "dayjs/plugin/weekYear";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

dayjs.extend(utc);

const Date = (props: PickerDateProps<any>) => {
  const { value, onChange, ...rest } = props;

  const handleChange = (date, dateString) => {
    onChange(date && dayjs.utc(date).format(DATE_FORMAT.standard), dateString);
  };
  return (
    <DatePicker
      className={style.date}
      onChange={handleChange}
      value={value && moment.utc(value)} // use moment because DatePicker antd still use moment and not dayjs
      format={DATE_FORMAT.short}
      {...rest}
    />
  );
};

export default Date;
