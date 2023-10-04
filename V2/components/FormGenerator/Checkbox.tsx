import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Typography } from "@spenmo/splice";
import { Checkbox as AntdCheckbox } from "antd";
import { CheckboxProps as AntdCheckboxProps } from "antd/lib/checkbox";
import { FieldConsumerType } from "../../BillForm/type";

import styles from "./FormGenerator.module.scss";

interface CheckboxProps extends AntdCheckboxProps {
  textLabel?: string;
  disabled?: boolean;
}

const Checkbox = forwardRef((props: CheckboxProps & FieldConsumerType, ref) => {
  const checkboxRef = useRef(null);
  const { name, value, textLabel } = props;
  useImperativeHandle(ref, () => checkboxRef.current);

  return (
    <AntdCheckbox {...props} ref={checkboxRef} checked={value} data-testid={`checkboxField-${name}`}>
      <Typography className={styles.checkboxLabel} variant="body-content" size="s">
        {textLabel}
      </Typography>
    </AntdCheckbox>
  );
});

export default Checkbox;
