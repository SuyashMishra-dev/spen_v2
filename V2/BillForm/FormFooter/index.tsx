import React from "react";
import { Button } from "@spenmo/splice";

import { FormFooterProps } from "../type";
import styles from "./FormFooter.module.scss";

const FormFooter: React.FC<FormFooterProps> = (props) => {
  const { onClickBack, onSubmit, submitText, children, isSubmitLoading, ...rest } = props;

  return (
    <div className={styles.footer} {...rest}>
      <Button type="button" size="m" variant="tertiary" onClick={onClickBack}>
        Back
      </Button>
      <div className={styles.flex}>
        {children}
        <Button type="button" size="m" variant="primary" onClick={onSubmit} loading={isSubmitLoading}>
          {submitText}
        </Button>
      </div>
    </div>
  );
};

export default FormFooter;
