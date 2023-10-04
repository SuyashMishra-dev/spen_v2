import React, { useContext, useMemo, useState } from "react";
import { Modal } from "@spenmo/splice";
import { useForm, FormProvider } from "react-hook-form";
import useSWRMutation from "swr/mutation";

import { putData } from "API/Client";
import { useMatchMutate } from "API/useData";

import { appNotification } from "Modules/appNotification/appNotification";
import { SidePanel } from "Modules/DS/SidePanel";
import RecipientForm from "./RecipientForm";
import RecipientPreview from "./RecipientPreview";
import { useDisclosure } from "../hooks/useDisclosure";
import FormFooter from "../BillForm/FormFooter";

import { BillContext } from "../context/BillContext";
import { FormContext } from "../context/FormContext";
import { RecipientFormInputs } from "./types";
import { API_URL } from "../constants";
import { omitKey } from "../utilities";
import { billDiscard } from "assets/img";

import styles from "./Recipients.module.scss";

const RecipientSidepanel: React.FC = () => {
  const formMethods = useForm<RecipientFormInputs>({
    defaultValues: {
      meta: {
        recipientDetail: undefined,
        isLoadingField: undefined,
      },
    },
  });
  const { handleSubmit, watch, unregister } = formMethods;
  const {
    isOpenRecipientSidePanel,
    setIsOpenRecipientSidePanel,
    dynamicFieldsIdentifier,
    recipientSelectedID,
    setRecipientSelectedID,
  } = useContext(BillContext);
  const { isOpen: isShowPreview, onOpen: openPreview, onClose: closePreview } = useDisclosure();
  const { isOpen: isShowDiscardModal, onOpen: openDiscardModal, onClose: closeDiscardModal } = useDisclosure();
  const matchMutate = useMatchMutate();

  const [refetchValues, setRefetchValues] = useState({});
  const currentFormValue = watch();

  const parseValue = (value: any) => {
    if (typeof value === "undefined") {
      return undefined;
    }
    return String(value);
  };

  const recipientPayload = useMemo(() => {
    if (!Object.keys(dynamicFieldsIdentifier).length || typeof currentFormValue?.dynamicFields !== "object") {
      return;
    }

    const parsedDynamicFields = Object.entries(currentFormValue.dynamicFields).reduce((prev, [key, value]) => {
      if (!dynamicFieldsIdentifier?.[`dynamicFields.${key}`]) {
        return prev;
      }
      return [
        ...prev,
        {
          id: dynamicFieldsIdentifier[`dynamicFields.${key}`].id,
          value: parseValue(value),
        },
      ];
    }, []);

    return {
      id: recipientSelectedID,
      source: "vendor_management",
      ...omitKey(currentFormValue, "meta"),
      dynamicFields: parsedDynamicFields,
    };
  }, [currentFormValue, dynamicFieldsIdentifier, recipientSelectedID]);

  const { trigger, isMutating } = useSWRMutation(
    API_URL.saveRecipient,
    (url: string, { arg }: { arg: typeof recipientPayload }) => putData(url, arg),
    {
      onSuccess: async (res) => {
        const isEdited = Boolean(recipientSelectedID);
        appNotification.success({
          message: `${currentFormValue.legalName} has been ${isEdited ? "edited" : "succcessfully added"}`,
        });

        await matchMutate(new RegExp(API_URL.recipientList));
        if (isEdited) {
          await matchMutate(new RegExp(`${API_URL.recipientDetail}/${recipientSelectedID}`));
        } else {
          setRecipientSelectedID(res.data.payload.ID);
          await matchMutate(new RegExp(`${API_URL.recipientDetail}/${res.data.payload.ID}`));
        }
        closeSidePanel();
      },
    }
  );

  const closeSidePanel = () => {
    closePreview();
    setIsOpenRecipientSidePanel(false);
    unregister();
    closeDiscardModal();

    // reset fields
    setRefetchValues({});
  };

  const submitRecipientForm = () => {
    trigger(recipientPayload);
  };

  return (
    <>
      <FormContext.Provider
        value={{
          // TO DO: create a custom Provider component for FormContext
          refetchValues,
          setRefetchValues,
        }}
      >
        <FormProvider {...formMethods}>
          <SidePanel
            sidePanelClassName={styles.sidepanel}
            visible={isOpenRecipientSidePanel}
            onClose={openDiscardModal}
            title={`${recipientSelectedID ? "Edit" : "New"} Recipient`}
            sticky
          >
            <form>
              {isShowPreview && recipientPayload && <RecipientPreview previewPayload={recipientPayload} />}

              {/* just hide it from UI, unmount this component will reset the form state */}
              <div className={isShowPreview ? styles.hidden : undefined}>
                <RecipientForm />
              </div>

              {isShowPreview ? (
                <FormFooter
                  onClickBack={closePreview}
                  onSubmit={submitRecipientForm}
                  isSubmitLoading={isMutating}
                  submitText="Submit"
                  key="sidepanel-footer-preview"
                />
              ) : (
                <FormFooter
                  onClickBack={openDiscardModal}
                  onSubmit={handleSubmit(openPreview)}
                  submitText="Preview Recipient"
                  key="sidepanel-footer-form"
                />
              )}
            </form>
          </SidePanel>
        </FormProvider>
      </FormContext.Provider>

      <Modal
        showModal={isShowDiscardModal}
        size="medium"
        title="Discard Changes?"
        onClose={closeDiscardModal}
        footerFullWidthButtons
        primaryActionButton={{
          title: "Keep editing?",
          action: closeDiscardModal,
        }}
        secondaryActionButton={{
          title: "Discard Changes",
          action: closeSidePanel,
        }}
        className={styles.discardModal}
      >
        <img className={styles.images} src={billDiscard} alt="Discard Changes?" width={120} height={120} />
        <div>There are unsaved changes in this recipient form. Do you want to discard these changes?</div>
      </Modal>
    </>
  );
};

export default RecipientSidepanel;
