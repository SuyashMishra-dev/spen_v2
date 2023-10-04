import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import { postData } from "API/Client";

import LoadingIcon from "Modules/loading";
import { appNotification } from "Modules/appNotification/appNotification";
import Steps from "Modules/Steps";
import { SidePanel } from "Modules/DS/SidePanel";
import BillDetail from "./BillDetail";
import PaymentDetail from "./PaymentDetail";
import BillPreview from "./BillPreview";

import { BillContext } from "../context/BillContext";
import { FormContext } from "../context/FormContext";
import { useBeforeUnload } from "../hooks/useBeforeUnload";
import { useDisclosure } from "../hooks/useDisclosure";

import { GetOrgId, GetUserId } from "utility";
import { API_URL, BillFormType, BillParams, FX_RATE_EXPIRED_CODE } from "../constants";
import { BillFormFields, OCRData, VendorDetailData } from "./type";

import BillStyle from "../Bills.module.scss";
import styles from "./BillForm.module.scss";
import Uploader from "./Uploader";
import { useErrorHandler } from "../context/ErrorHandlerContext";
import WTHModal from "../components/WTHModal/WTHModal";

const BillForm: React.FC = () => {
  const method = useForm<BillFormFields>({
    defaultValues: {
      source: "portal_single",
    },
  });
  const { handleSubmit, formState, getValues, reset } = method;
  const { isDirty } = formState;

  const history = useHistory();

  const params = useParams<BillParams>();

  const [step, setStep] = useState(0);
  // for additional fields page
  const [formPage, setFormPage] = useState<number>();
  // TO DO: Put this inside a custom Provider Component?
  const [showPrompt, setShowPrompt] = useState(false);
  const [ocrData, setOCRData] = useState<OCRData | undefined>();
  const [refetchValues, setRefetchValues] = useState({});
  const [vendorDetail, setVendorDetail] = useState<VendorDetailData>();
  // TO DO: probably need to change the name to billAmount
  const [isAmountChanged, setIsAmountChanged] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFxRateExpired, setIsFxRateExpired] = useState(false);
  const formRef = useRef();

  const isBillFormVisible = params.form === BillFormType.NEW_BILL;
  const promptCondition = isBillFormVisible && isDirty;

  const { UnloadModal, setConfirmCondition } = useBeforeUnload(promptCondition);
  const { isOpen: isShowForm, onClose: closeShowForm, onOpen: openShowForm } = useDisclosure();
  const { setRecipientSelectedID } = useContext(BillContext);
  const { setClickSave, handleError } = useErrorHandler();

  const resetAndCloseForm = useCallback(() => {
    // reset Form
    // TO DO: either this or
    // history.push("/bills/drafts");
    history.goBack();

    closeShowForm();
    reset();
    setStep(0);
    // IMPROVEMENT: in my opinion, it's better to
    // put this inside the specific form rather than the full form.
    // but step 1 & 2 may connected.
    setRefetchValues({});
    setRecipientSelectedID(undefined);

    // console.log("getValues", getValues());
  }, [closeShowForm, history, reset, setRecipientSelectedID]);

  const handleClose = useCallback(() => {
    if (promptCondition) {
      setShowPrompt(true);
      return;
    }

    resetAndCloseForm();
  }, [promptCondition, resetAndCloseForm]);

  const handleClickDiscard = () => {
    setShowPrompt(false);
    resetAndCloseForm();
  };

  const handleSaveDraft = () => {
    const data = getValues();
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value !== "undefined" && value !== null) {
        if (["addNotes"].includes(key)) {
          return;
        }

        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    postData(API_URL.saveAsDraft, formData, false, {
      headers: {
        "X-Organization-Id": GetOrgId(),
        "X-User-Id": GetUserId(),
        "X-Is-Opsy": false,
      },
    })
      .then((res) => {
        if (res.data.payload.isSuccess) {
          // TO DO: notification if success
          setConfirmCondition(false);
          resetAndCloseForm();
          setShowPrompt(false);
          return;
        }

        // if other than success
        handleError({
          retry: {
            id: "saveDraft",
            onClickRetry: handleSaveDraft,
          },
        });
      })
      .catch((e) => {
        console.error(e);
        handleError({
          retry: {
            id: "saveDraft",
            onClickRetry: handleSaveDraft,
          },
        });
      });
  };

  const handleUpload = (status: "uploading" | "done") => {
    if (status === "uploading") {
      setIsUploading(true);
      return;
    } else if (status === "done") {
      openShowForm();
    }

    setIsUploading(false);
  };

  useEffect(() => {
    // more info: https://legacy.reactjs.org/docs/hooks-reference.html#lazy-initial-state
    setClickSave(() => handleSaveDraft);
  }, []);

  const handleSubmitForm: SubmitHandler<BillFormFields> = useCallback(
    (data) => {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]: [string, any]) => {
        if (typeof value !== "undefined" && value !== null) {
          if (["addNotes", "suggestDateCheckbox", "walletID"].includes(key)) {
            return;
          }
          if (typeof value === "object") {
            if (key === "billTax") {
              formData.append(key, JSON.stringify({ ...value, invoiceAmount: Number(value.invoiceAmount) })); // Backend accepts invoice amount as a number
            } else {
              formData.append(key, JSON.stringify(value));
            }
          } else {
            formData.append(key, String(value));
          }
        }
      });
      // walletId is replaced by teamId here as backend accepts teamId
      formData.append("teamID", data.walletID);

      postData(API_URL.submitBill, formData, false)
        .then((res) => {
          resetAndCloseForm();
          appNotification.success({
            message: "Bill has been successfully submitted for {CTA}",
          });
        })
        .catch((err) => {
          if (err?.response?.data?.error?.code === FX_RATE_EXPIRED_CODE) {
            setIsFxRateExpired(true);
            // If fxrates get expired then move back to payment details page.
            setStep(1);
          } else {
            appNotification.error({
              message: "An error occurred when submitting bill(s). Please try again.",
            });
          }
        });
    },
    [resetAndCloseForm]
  );

  const formComponent = useMemo(() => {
    switch (step) {
      case 0: {
        return (
          <BillDetail
            onBack={handleClose}
            onNext={() => setStep(1)}
            isShowForm={isShowForm}
            onShowForm={openShowForm}
          />
        );
      }
      case 1: {
        // onNext should be either submit or go to step 3
        // which is additional fields from the vendor management form
        return (
          <PaymentDetail
            ref={formRef}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            formPage={formPage}
            onChangeFormPage={setFormPage}
          />
        );
      }
      case 2: {
        // onNext should be either submit or go to step 3
        // which is additional fields from the vendor management form
        return <BillPreview onBack={() => setStep(1)} onNext={handleSubmit(handleSubmitForm)} />;
      }
    }
    return null;
  }, [step, handleClose, isShowForm, openShowForm, formPage, handleSubmit, handleSubmitForm]);

  return (
    <>
      <UnloadModal
        visible={showPrompt}
        onClose={() => setShowPrompt(false)}
        onClickDiscard={handleClickDiscard}
        onClickSave={handleSaveDraft}
      />
      <SidePanel
        sidePanelClassName={BillStyle.sidepanel}
        visible={isBillFormVisible}
        withOverlay
        onClose={handleClose}
        title="New Bill"
        sticky
      >
        <Steps
          current={step}
          data={[
            {
              title: "Bill details",
            },
            {
              title: "Payment details",
            },
            {
              title: "Preview",
            },
          ]}
        />
        <FormContext.Provider
          value={{
            // TO DO: create a custom Provider component for FormContext
            vendorDetail,
            setVendorDetail,
            handleSaveDraft,
            refetchValues,
            setRefetchValues,
            isAmountChanged,
            setIsAmountChanged,
            ocrData,
            setOCRData,
            isFxRateExpired,
            setIsFxRateExpired,
          }}
        >
          <FormProvider {...method}>
            <form ref={formRef} className={styles.BillForm}>
              <Uploader onHandleUpload={handleUpload} showField={step === 0} />
              {formComponent}
              {isUploading && (
                <div>
                  <div className={styles.overlay} />
                  <LoadingIcon className={styles.overlayIcon} />
                </div>
              )}
            </form>
            <WTHModal />
          </FormProvider>
        </FormContext.Provider>
      </SidePanel>
    </>
  );
};

export default BillForm;
