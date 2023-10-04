import React from "react";
import Modal, { ModalComponent } from "Modules/DS/Modal";
import { Button, Typography } from "@spenmo/splice";
import { greyCloseIcon, miniSpotSearchIcon } from "assets/img";
import { useDisclosure } from "../../hooks/useDisclosure";
import { TITLE_TYPE } from "Modules/DS/Modal/types";
import styles from "./WTHModal.module.scss";

const WTHModal: React.FC<any> = (props) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  return (
    <Modal visible={true} close={onClose} className={styles.modal}>
      <ModalComponent.CloseButton src={greyCloseIcon} />
      <ModalComponent.Title titleType={TITLE_TYPE.withBorder}>Confirm Withholding Tax Details</ModalComponent.Title>
      <img className={styles.image} src={miniSpotSearchIcon} alt="Something went wrong" width={120} height={120} />
      <div>
        <Typography className={styles.text} variant="body-content" tag="p" size="m">
          Recipient ATC Code and Tax Category:{" "}
          <span className={styles.bold}>
            [WI050] Management and technical consultants if the current year's gross income does not exceed
            P3,000,000.00
          </span>
        </Typography>
        <Typography className={styles.text} variant="body-content" tag="p" size="m">
          Withholding Tax Rate: <span className={styles.bold}>5%</span>
        </Typography>
        <Typography className={styles.text} variant="body-content" tag="p" size="m">
          Withholding Tax Amount: <span className={styles.bold}>PHP 880</span>
        </Typography>
      </div>
      <div className={styles.borderBottom} />
      <div className={styles.buttonGroup}>
        <Button size="m" variant="secondary" onClick={() => {}} type="button">
          Back to Edit Details
        </Button>
        <Button size="m" variant="primary" onClick={() => {}} type="button">
          Submit
        </Button>
      </div>
      <Typography className={styles.captionText} variant="body-content" tag="p" size="caption-s">
        By clicking the submit button, you confirm that the information you entered in the platform is correct and
        accurate to the best of your knowledge, and you further confirm that Spenmo shall not be held liable for any and
        all damages resulting from the information you have provided.
      </Typography>
    </Modal>
  );
};

export default WTHModal;
