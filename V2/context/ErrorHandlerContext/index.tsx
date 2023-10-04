import React, { MouseEvent, createContext, useContext, useState } from "react";
import { Button, Typography } from "@spenmo/splice";

import Modal, { ModalComponent } from "Modules/DS/Modal";
import { useDisclosure } from "../../hooks/useDisclosure";
import { greyCloseIcon, tinyError } from "assets/img";

import { TITLE_TYPE } from "Modules/DS/Modal/types";
import styles from "./ErrorHandler.module.scss";

interface ErrorHandlerContextValue {
  handleError: Function;
  setClickSave(value: Function): void;
  handleResetRefetch: Function;
  verifyErrorHandler(): boolean;
}

const ErrorHandlerContext = createContext<ErrorHandlerContextValue | null>(null);

type RefreshType = (e: MouseEvent<HTMLButtonElement>) => void;

interface Buttons {
  onClickSave?(e: MouseEvent<HTMLButtonElement>): boolean;
  onClickRetry?: RefreshType;
  retry?: {
    id: string;
    onClickRetry: RefreshType;
  };
}

export const useErrorHandler = () => {
  const errorHandler = useContext(ErrorHandlerContext);

  if (errorHandler === null) {
    throw Error("errorHandler requires ErrorHandlerProvider to be used higher in the component tree");
  }

  return errorHandler;
};

const ErrorHandlerProvider: React.FC = (props) => {
  const { children } = props;
  const { isOpen, onClose, onOpen } = useDisclosure();

  const [lastErrorId, setLastErrorId] = useState<string | undefined>();
  const [onClickSave, setClickSave] = useState<(e: MouseEvent<HTMLButtonElement>) => boolean>();
  const [refreshFunctions, setRefreshFunctions] = useState<Record<string, RefreshType>>({});

  const handleOpenModal = (callbackFns: Buttons) => {
    const { onClickRetry, onClickSave, retry } = callbackFns || {};
    onOpen();
    if (onClickSave) {
      setClickSave(() => onClickSave);
    }

    if (onClickRetry) {
      setRefreshFunctions((prev: Record<string, RefreshType>) => {
        const obj = { ...prev };
        // obj.push(onClickRetry);
        return obj;
      });
    }

    if (retry) {
      const { id, onClickRetry } = retry;
      setLastErrorId(id);
      setRefreshFunctions((prev: Record<string, RefreshType>) => ({
        ...prev,
        [id]: onClickRetry,
      }));
    }
  };

  const handleClickRefresh = (e?: MouseEvent<HTMLButtonElement>) => {
    const refreshKeys = Object.keys(refreshFunctions);

    if (!refreshKeys.length) {
      return refreshKeys;
    }

    const errorId = lastErrorId || refreshKeys[refreshKeys.length - 1];

    const { [errorId]: errorKey, ...rest } = refreshFunctions;
    const refreshFn = refreshFunctions[errorId];
    refreshFn(e);
    onClose();

    setLastErrorId(undefined);
    // delete from object
    setRefreshFunctions(rest);

    return Object.keys(rest);
  };

  const handleClickSave = (e: MouseEvent<HTMLButtonElement>) => {
    onClickSave(e);
    onClose();
  };

  const verifyErrorHandler = () => {
    const refreshKeys = Object.keys(refreshFunctions);
    let hasError = Boolean(refreshKeys);
    if (hasError) {
      hasError = Boolean(handleClickRefresh().length);
    }

    // verify return true if there is no error
    return !hasError;
  };

  const handleResetRefetch = () => {
    setRefreshFunctions({});
  };

  return (
    <ErrorHandlerContext.Provider
      value={{ handleError: handleOpenModal, setClickSave, handleResetRefetch, verifyErrorHandler }}
    >
      {children}
      <Modal visible={isOpen} close={onClose} className={styles.modal}>
        <ModalComponent.CloseButton src={greyCloseIcon} />
        <ModalComponent.Title titleType={TITLE_TYPE.withBorder}>Something went wrong</ModalComponent.Title>
        <img className={styles.image} src={tinyError} alt="Something went wrong" width={120} height={120} />
        <Typography className={styles.text} variant="body-content" tag="p" size="m">
          Our system encountered an error, please try again by refreshing the page or you can save it and try again
          later.
        </Typography>
        <div className={styles.buttonGroup}>
          <Button size="m" variant="secondary" onClick={handleClickRefresh} type="button">
            Refresh
          </Button>
          <Button size="m" variant="primary" onClick={handleClickSave} type="button">
            Save Draft
          </Button>
        </div>
      </Modal>
    </ErrorHandlerContext.Provider>
  );
};

export default ErrorHandlerProvider;
