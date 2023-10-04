import React, { forwardRef, useEffect, useState } from "react";
import { Select } from "antd";
import { useFormContext } from "react-hook-form";
import dayjs from "dayjs";

import styles from "./DateListPicker.module.scss";
import { DATE_FORMAT } from "Views/Bills/V2/constants";
import { DateListPickerProps } from "../../type";
import Date from "../../Date";
import utc from "dayjs/plugin/utc";

// We should always use UTC value if we don't send full date format with timezone
dayjs.extend(utc);

const DateListPicker = forwardRef((props: Partial<DateListPickerProps>, ref) => {
  const { name, value, onChange, refField, ...rest } = props;

  const { getValues } = useFormContext();
  const refDate = getValues(refField);

  const [showPicker, setShowPicker] = useState(Boolean(refDate));
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const { Option } = Select;

  const dueDateDistance = [7, 14, 21, 30];
  const dueDateList = dueDateDistance.map((item) => {
    const dateValue = dayjs.utc(refDate).add(item, "day");
    return {
      label: `+${item} days`,
      subLabel: dateValue.format(DATE_FORMAT.short),
      value: dateValue.format(DATE_FORMAT.standard),
    };
  });

  useEffect(() => {
    setShowPicker(!Boolean(refDate));
  }, [refDate]);

  const handleOnChange = (value) => {
    onChange(value);
  };

  useEffect(() => {}, [value]);

  return (
    <>
      {!refDate || showPicker ? (
        <Date
          {...rest}
          open={openDatePicker}
          onOpenChange={(open) => {
            setOpenDatePicker(open);
            if (!open && refDate) {
              setShowPicker(false);
            }
          }}
          allowClear
          format={DATE_FORMAT.short}
          defaultValue={value && dayjs.utc(value)}
          value={value && dayjs.utc(value)}
          onChange={(val) => {
            handleOnChange(val);
            setOpenDatePicker(false);
          }}
        />
      ) : (
        <Select
          {...rest}
          allowClear
          className={styles.dateListSelect}
          defaultValue={value && dayjs.utc(value).format(DATE_FORMAT.short)}
          value={value && dayjs.utc(value).format(DATE_FORMAT.short)}
          onChange={(val) => {
            handleOnChange(val && dayjs.utc(val).format(DATE_FORMAT.standard));
          }}
          dropdownRender={(menu) => {
            return (
              <div className={styles.dateListDropdown}>
                {menu}
                <div
                  className={styles.customDateBtn}
                  onClick={() => {
                    setShowPicker(true);
                    setOpenDatePicker(true);
                  }}
                >
                  Custom date
                </div>
              </div>
            );
          }}
        >
          {dueDateList.map((item) => {
            return (
              <Option key={item.value} value={item.value}>
                <div className={styles.optionItem}>
                  <div className={styles.label}>{item.label}</div>
                  <div className={styles.subLabel}>{item.subLabel}</div>
                </div>
              </Option>
            );
          })}
        </Select>
      )}
    </>
  );
});

export default DateListPicker;
