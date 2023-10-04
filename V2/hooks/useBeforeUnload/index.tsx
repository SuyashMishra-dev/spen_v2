import React, { useEffect, useState } from "react";
import { Button, Typography } from "@spenmo/splice";

import Modal, { ModalComponent } from "Modules/DS/Modal";

import { greyCloseIcon, billDiscard } from "assets/img";
import { TITLE_TYPE } from "Modules/DS/Modal/types";

import styles from "./UnloadPrompt.module.scss";

interface UnloadPromptProps {
  visible: boolean;
  onClose(): void;
  onClickDiscard(): void;
  onClickSave(): void;
}

// IMPROVEMENT: Possible to make it more atomic
// to be used in other pages
export const useBeforeUnload = (confirmCondition: boolean) => {
  const [condition, setCondition] = useState(confirmCondition);

  useEffect(() => {
    setCondition(confirmCondition);
  }, [confirmCondition]);

  useEffect(() => {
    const confirmExit = (e: Event) => {
      e.preventDefault();

      e.returnValue = true;
    };

    if (condition) {
      window.addEventListener("beforeunload", confirmExit);
    }

    return () => {
      window.removeEventListener("beforeunload", confirmExit);
    };
  }, [condition]);

  const UnloadModal = (props: UnloadPromptProps) => {
    const { onClose, onClickDiscard, onClickSave, visible } = props;

    return (
      <Modal visible={visible} close={onClose} className={styles.modal}>
        <ModalComponent.CloseButton src={greyCloseIcon} />
        <ModalComponent.Title titleType={TITLE_TYPE.withBorder}>Discard Changes?</ModalComponent.Title>
        <img className={styles.image} src={billDiscard} alt="Discard Changes?" width={120} height={120} />
        <Typography className={styles.text} variant="body-content" tag="p" size="m">
          There are unsaved changes in this bill. Do you want to discard these changes?
        </Typography>
        <div className={styles.buttonGroup}>
          <Button size="m" variant="secondary" onClick={onClickDiscard}>
            Discard Changes
          </Button>
          <Button size="m" variant="primary" onClick={onClickSave}>
            Save Changes
          </Button>
        </div>
      </Modal>
    );
  };

  return {
    UnloadModal,
    setConfirmCondition: setCondition,
  };
};
