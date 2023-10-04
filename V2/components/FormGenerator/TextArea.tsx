import React from "react";
import { Input as AntInput } from "antd";

import { ControllerRenderProps } from "react-hook-form";
import { TextAreaProps } from "antd/lib/input";
import { Typography } from "@spenmo/splice";

import styles from "./FormGenerator.module.scss";

const TextArea = (props: Partial<TextAreaProps & ControllerRenderProps>) => {
  const { value = "", maxLength, showCount } = props;
  return (
    <>
      <AntInput.TextArea {...props} className={styles.textArea} maxLength={maxLength || undefined} />
      {showCount && maxLength > 0 && (
        <Typography className={styles.textCounter} variant="body-content" tag="p" size="caption-m">
          {maxLength - value.length} characters left
        </Typography>
      )}
    </>
  );
};

export default TextArea;
