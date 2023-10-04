import React, { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Button as AntButton, Select } from "antd";
import { Banner, EditOutline, InfoFilled, Typography, Button } from "@spenmo/splice";
import { useFormContext } from "react-hook-form";

import Icon from "Modules/icons";

import { useMutableData } from "API/useData";

import { useDisclosure } from "../../../../hooks/useDisclosure";
import { API_URL } from "../../../../constants";
import { getResponsePayload } from "../../../../utilities";
import { BillContext } from "Views/Bills/V2/context/BillContext";
import { useBillForm } from "Views/Bills/V2/context/FormContext";
import { BillFormProviderProps } from "../../../../BillForm/type";

import { dataTableNoRecordFound } from "assets/img";
import styles from "../../FormGenerator.module.scss";
import customStyles from "./RecipientSelect.module.scss";
import { useErrorHandler } from "Views/Bills/V2/context/ErrorHandlerContext";

/**
 * This component is using react-hook-form.
 * Please use FormProvider before using this.
 * This component should NOT be copied to other page component
 * since it's using css from BillForm
 */
const RecipientSelect = forwardRef((props: any, ref) => {
  const { value, onChange, ...rest } = props;
  const { setIsOpenRecipientSidePanel, recipientSelectedID, setRecipientSelectedID } = useContext(BillContext);
  const { setVendorDetail, ocrData } = useBillForm<BillFormProviderProps>();
  const { setValue } = useFormContext();
  const { handleError } = useErrorHandler();

  const selectRef = useRef(null);
  useImperativeHandle(ref, () => selectRef.current);

  const [search, setSearch] = useState("");
  const { isOpen, toggle, onOpen, onClose } = useDisclosure();

  const { data, mutate: refetchList, error: listError } = useMutableData(API_URL.recipientList);

  const recipientList = useMemo(() => {
    const list = getResponsePayload<any[]>(data) || [];

    return list.map((item) => ({
      label: item.legalName,
      value: item.id,
    }));
  }, [data]);

  const {
    data: recipientDetail,
    mutate: refetchDetail,
    error: detailError,
  } = useMutableData(recipientSelectedID ? `${API_URL.recipientDetail}/${recipientSelectedID}` : null);

  useEffect(() => {
    if (listError) {
      handleError({
        retry: {
          id: "recipientList",
          onClickRetry: refetchList,
        },
      });
    }
  }, [listError]);

  useEffect(() => {
    if (detailError) {
      handleError({
        retry: {
          id: "recipientDetail",
          onClickRetry: refetchDetail,
        },
      });
    }
  }, [detailError]);

  // since we are using custom value and setter,
  // this action need to sync the value to react hook form
  useEffect(() => {
    setValue("vendorID", recipientSelectedID);
  }, [setValue, recipientSelectedID]);

  // set vendor detail to the context
  useEffect(() => {
    if (recipientDetail?.data?.payload) {
      // IMPROVEMENT: should not use context at all
      // use `useMutableData` instead. since we only need the value
      setVendorDetail(recipientDetail?.data?.payload);
    }
  }, [setVendorDetail, recipientDetail]);

  const handleOnChange = (value: string) => {
    setRecipientSelectedID(Number(value) || undefined);
  };

  const handleNewRecipient = () => {
    handleOnChange(undefined);
    setIsOpenRecipientSidePanel(true);
    onClose();
  };

  const handleEdit = () => {
    setIsOpenRecipientSidePanel(true);
  };

  const renderNotFound = () => {
    return (
      <div className={styles.notFound}>
        <Icon src={dataTableNoRecordFound} alt="no result found" />
        <div className={styles.notFoundText}>
          {recipientList?.length
            ? `No recipient matching “${search}” found.`
            : "You do not have any saved recipients. Create a new recipient to retrieve them in this list for future payments."}
        </div>
      </div>
    );
  };

  const dropdownRecipientRender = (menu: React.ReactElement<any, string | React.JSXElementConstructor<any>>) => {
    const isRecipientExist =
      (search.length > 0 && search.length <= 3) ||
      Boolean(recipientList?.find((item) => item.label.toLowerCase() === search.toLowerCase()));

    return (
      <>
        {menu}
        <AntButton className={styles.newSelectButton} disabled={isRecipientExist} onClick={handleNewRecipient}>
          + New Recipient{search ? ` “${search}”` : ""}
        </AntButton>
      </>
    );
  };

  const isNewRecipient = Boolean(ocrData) && !ocrData.vendorID && !ocrData.isSameWithOCR;
  const showBanner = isNewRecipient && !recipientSelectedID;

  return (
    <div className={customStyles.wrapper}>
      {Boolean(recipientSelectedID) && (
        <div className={customStyles.actions}>
          <EditOutline iconColor="#0C75D2" size="16" role="button" onClick={handleEdit} />
        </div>
      )}
      <Select
        showSearch
        open={isOpen}
        ref={selectRef}
        onSearch={setSearch}
        filterOption={(value, elem: any) => {
          if (elem?.label) {
            return elem.label.toLowerCase().indexOf(value.toLowerCase()) !== -1;
          }
        }}
        notFoundContent={renderNotFound()}
        dropdownRender={dropdownRecipientRender}
        placeholder="Select recipient"
        options={recipientList}
        onDropdownVisibleChange={toggle}
        {...rest}
        // We need a custom value and setter since the state is used in multiple forms.
        // Therefore, we prefer using the context instead of the value from useForm.
        onChange={handleOnChange}
        value={recipientSelectedID}
      />
      {showBanner && (
        <div className={customStyles.infoPanel}>
          <Banner
            icon={InfoFilled}
            variant="warning"
            title="New recipient detected"
            description={
              <div className={customStyles.infoBody}>
                <Typography variant="body-content" size="m" tag="p">
                  Is this your first time paying this recipient?
                </Typography>
                <div className={customStyles.btnGroup}>
                  <Button variant="primary" size="s" type="button" onClick={onOpen}>
                    <b>Yes -</b> Find in Spenmo
                  </Button>
                  <Button variant="secondary" size="s" type="button" onClick={handleNewRecipient}>
                    <b>No -</b> Add in Spenmo
                  </Button>
                </div>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
});

export default RecipientSelect;
