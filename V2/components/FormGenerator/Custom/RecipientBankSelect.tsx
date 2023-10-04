import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Select as AntSelect, Button } from "antd";
import { useFormContext } from "react-hook-form";
import { CrossOutline } from "@spenmo/splice";
import { InputProps } from "antd/lib/input";

import Input from "../Input";
import { useDisclosure } from "Views/Bills/V2/hooks/useDisclosure";

import { useBillForm } from "Views/Bills/V2/context/FormContext";

import styles from "../FormGenerator.module.scss";

const RecipientBankSelect = forwardRef((props: any, ref) => {
  const { options, onChange, name } = props;
  const { isOpen: isOpenNewBank, onOpen: onOpenNewBank, onClose: onCloseNewBank } = useDisclosure();
  const { setRefetchValues } = useBillForm();
  const { setValue } = useFormContext();

  const selectRef = useRef(null);
  useImperativeHandle(ref, () => selectRef.current);

  const resetFields = () => {
    // IMPROVEMENT: shouldn't manually emptying fields
    setValue("dynamicFields.swiftCode", "");
  };

  const handleOpenNewBank = () => {
    // empty up the input
    onOpenNewBank();

    onChange("");
    resetFields();

    setRefetchValues((prev) => ({
      ...prev,
      [name]: {
        isNewData: true,
      },
    }));
  };

  const handleChangeBank = (value) => {
    resetFields();

    onChange(value);
  };

  const handleCloseNewBank = () => {
    onCloseNewBank();
    setRefetchValues((prev) => {
      const { [name]: deleteKey, ...rest } = prev || {};

      return rest;
    });
  };

  const dropdownRender = (menu: React.ReactElement<any, string | React.JSXElementConstructor<any>>) => {
    return (
      <>
        {menu}
        <Button className={styles.newSelectButton} onClick={handleOpenNewBank}>
          + New Recipient Bank
        </Button>
      </>
    );
  };

  if (isOpenNewBank) {
    return (
      <Input
        {...(props as unknown as InputProps)}
        suffix={
          <div onClick={handleCloseNewBank}>
            <CrossOutline size="24" iconColor="#545454" />
          </div>
        }
      />
    );
  }

  return (
    <AntSelect
      ref={selectRef}
      {...props}
      onChange={handleChangeBank}
      dropdownClassName={styles.selectOptionMultilines}
      showSearch
      dropdownRender={dropdownRender}
      filterOption={(value, elem: any) => {
        if (elem?.label) {
          return elem.label.toLowerCase().indexOf(value.toLowerCase()) !== -1;
        }
      }}
    >
      {React.Children.toArray(
        options.map((item) => (
          <AntSelect.Option value={item.value} label={item.label}>
            {Boolean(item.additionalCode) ? (
              <>
                <div>{item.label}</div>
                <div>{item.additionalCode}</div>
              </>
            ) : (
              <>{item.label}</>
            )}
          </AntSelect.Option>
        ))
      )}
    </AntSelect>
  );
});

export default RecipientBankSelect;
