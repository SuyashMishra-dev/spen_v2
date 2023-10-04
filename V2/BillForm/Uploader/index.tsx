import React, { useRef, MouseEvent, useState, useContext } from "react";
import cn from "classnames";
import { Tooltip, Upload } from "antd";
import { RcCustomRequestOptions, RcFile, UploadFile } from "antd/lib/upload/interface";
import { CrossFilled, InfoOutline, UploadOutline, DeleteOutline, Typography } from "@spenmo/splice";
import { Document, Page } from "react-pdf";
import { useHistory, useLocation } from "react-router-dom";
import { Controller, useFormContext } from "react-hook-form";

import APIClient from "API/Client";
import { appNotification } from "Modules/appNotification/appNotification";

import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_FILE_EXTENSIONS_FORMATTED,
  API_URL,
  DEFAULT_ERROR_MESSAGE,
  MAX_ALLOWED_FILE_UPLOAD,
  MAX_FILE_SIZE_ALLOWED,
  MAX_FILE_SIZE_ALLOWED_IN_MB,
  TAB_LIST,
} from "../../constants";
import { getAcceptedFiles } from "../../utilities";
import { trackEvent } from "utility/analytics";
import { uploadInvoice } from "assets/img";
import { BillContext } from "../../context/BillContext";
import { useBillForm } from "../../context/FormContext";
import { BillFormProviderProps } from "../../BillForm/type";
import { mapOcrData } from "./helper";

import styles from "./Uploader.module.scss";
interface UploaderProps {
  onHandleUpload(status: "uploading" | "done"): void;
  showField?: boolean;
}

interface FileItemProps {
  file: UploadFile;
  onDelete(): void;
}

interface ErrorUploadProps {
  name: string;
  width?: number;
  height?: number;
}

const FilePlaceholder = (props: ErrorUploadProps) => {
  const { name, width = 32, height = 32 } = props;

  return <img className={styles.thumbnail} src={uploadInvoice} alt={name} width={width} height={height} />;
};

const renderThumbnail = (file: UploadFile, width: number = 32, height: number = 32) => {
  const { status, type, response, name } = file;
  const { fileUrl } = response || {};
  const isDone = status === "done";
  const isPDF = type === "application/pdf";

  if (!isDone) {
    return <FilePlaceholder name={name} width={width} height={height} />;
  }

  if (isPDF) {
    return (
      <Document file={fileUrl} error={<FilePlaceholder name={name} />} noData={<FilePlaceholder name={name} />}>
        <Page pageNumber={1} />
      </Document>
    );
  }

  return <img className={styles.thumbnail} src={fileUrl} alt={name} width={width} height={height} />;
};

const FileItem = (props: FileItemProps) => {
  const { file, onDelete } = props;
  const { response, name } = file;
  const { fileUrl } = response || {};

  const handleClickPreview = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();

    window.open(fileUrl, "__blank");
  };

  return (
    <div className={styles.previewItem}>
      <a className={styles.link} rel="noopener noreferrer" href={fileUrl} target="_blank" onClick={handleClickPreview}>
        <div className={styles.imgContainer}>{renderThumbnail(file)}</div>
        <Typography className={styles.fileName} variant="body-content" tag="p" size="s">
          {name}
        </Typography>
      </a>
      <CrossFilled className={styles.closeIcon} iconColor="var(--icon-strong)" size="16" onClick={onDelete} />
    </div>
  );
};

const Uploader: React.FC<UploaderProps> = (props) => {
  const { onHandleUpload, showField } = props;
  const history = useHistory();
  const location = useLocation();

  const { setValue, control } = useFormContext();
  const { ocrData, setOCRData } = useBillForm<BillFormProviderProps>();
  const { setRecipientSelectedID } = useContext(BillContext);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const isMultiUploaded = useRef(false);

  const validateFile = (file: RcFile) => {
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const extensionValid = ALLOWED_FILE_EXTENSIONS.includes(fileExtension);
    const sizeValid = file.size <= MAX_FILE_SIZE_ALLOWED;
    const isFileValid = extensionValid && sizeValid;

    if (!extensionValid) {
      appNotification.error({
        key: "allowed-file-extension",
        message: `Only ${ALLOWED_FILE_EXTENSIONS.join(", ")} extensions are allowed.`,
      });
    } else if (!sizeValid) {
      appNotification.error({
        key: "max-file-size",
        message: `Maximum file size exceeded. Please keep your file under ${MAX_FILE_SIZE_ALLOWED_IN_MB} MB.`,
      });
    }

    return isFileValid;
  };

  // single file
  const handleChangeFile = ({ file }, callbackFn) => {
    /* only setFileList on uploading / done.
    doing [file] since we only allowed a single file
    but the function accept array of files
    */
    setFileList(getAcceptedFiles([file]));

    onHandleUpload(file.status);

    if (file.status === "done") {
      const { response } = file;
      const mappedOCRData = mapOcrData(response);
      setOCRData(mappedOCRData);
      if (mappedOCRData.vendorID) setRecipientSelectedID(mappedOCRData.vendorID);

      // call Form hooks onChange
      callbackFn(mappedOCRData.ocrID);

      // set bill form value from OCR
      Object.entries(mappedOCRData).forEach(([key, value]) => {
        setValue(key, value);
      });
    }
  };

  const handleMultipleUpload = (fileList: RcFile[]) => {
    if (isMultiUploaded.current) {
      return;
    }

    if (fileList.length > MAX_ALLOWED_FILE_UPLOAD) {
      appNotification.error({
        key: "max-file-upload",
        message: "Can't upload more than 30 files",
      });
      return;
    }

    const formData = new FormData();

    const validatedFiles = fileList.filter((file) => {
      const isValid = validateFile(file);
      if (isValid) {
        formData.append("files", file);
      }
      return isValid;
    });

    if (!validatedFiles.length) {
      return;
    }

    isMultiUploaded.current = true;

    history.push(TAB_LIST[1].link, {
      ...(location.state as object),
      isUploading: true,
    });

    APIClient.postData(API_URL.draftUpload, formData).then(() => {
      appNotification.success({
        message: `${validatedFiles.length} of ${fileList.length} attachments are being uploaded.`,
      });
      history.push(TAB_LIST[1].link, {
        ...(location.state as object),
        isUploading: false,
      });
    });
  };

  const handleBeforeUpload = (file: RcFile, fileList: RcFile[]): boolean => {
    // check multiple uploads
    if (fileList.length > 1) {
      handleMultipleUpload(fileList);
      return false;
    }

    if (!validateFile(file)) {
      return false;
    }

    // single file
    return fileList.length === 1;
  };

  const handleRequest = async (options: RcCustomRequestOptions) => {
    const { file, onProgress, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file);

    APIClient.postData(API_URL.extractOCR, formData, false, {
      onUploadProgress: onProgress,
      timeout: 30000, // 30s
    })
      .then((res) => {
        const { payload: extractPayload, error } = res.data;

        onSuccess(extractPayload, file);
        if (error?.message) {
          appNotification.error({ message: error.message });
        }
        trackEvent("bill upload attachment success");
      })
      .catch((e) => {
        console.error(e);
        onError(e);
        appNotification.error({ message: DEFAULT_ERROR_MESSAGE });
        trackEvent("bill upload attachment success");
      });
  };

  const handleDeleteFile = () => {
    setFileList([]);
  };

  const handleUpdateFile = () => {
    const uploader = document.getElementById("ocrUpload");

    if (uploader) {
      uploader.click();
    }
  };

  const { status, response } = fileList?.[0] || {};
  const { fileUrl } = response || {};

  return (
    <div
      className={cn(styles.uploader, {
        [styles.separator]: showField,
      })}
    >
      {showField && (
        <Controller
          name="ocrID"
          control={control}
          render={({ field }) => {
            const { onChange, value, ...rest } = field;
            const defaultFileList = value
              ? {
                  uid: "default-invocie-file",
                  name: value?.name,
                  size: value?.size,
                  type: value?.type,
                  status: "done" as "done",
                  url: value,
                }
              : undefined;

            return (
              <Upload.Dragger
                {...rest}
                id="ocrUpload"
                multiple
                accept={ALLOWED_FILE_EXTENSIONS_FORMATTED}
                defaultFileList={[defaultFileList]}
                fileList={fileList}
                showUploadList={false}
                beforeUpload={handleBeforeUpload}
                customRequest={handleRequest}
                onChange={(e) => handleChangeFile(e, onChange)}
              >
                <div className={styles.uploaderArea}>
                  <UploadOutline className={styles.uploadIcon} iconColor="var(--icon-strong)" size="24" />
                  <div className={styles.uploadInfo}>
                    <Typography className={styles.title} variant="headline-content" tag="h3" size="m">
                      {!ocrData ? "Upload Bills" : "Upload a Bill"}
                    </Typography>
                    {fileList.length ? (
                      <div className={styles.preview} onClick={(e) => e.stopPropagation()}>
                        {fileList.map((file, index) => {
                          return <FileItem key={`${file.name}-${index}`} file={file} onDelete={handleDeleteFile} />;
                        })}
                      </div>
                    ) : (
                      <div className={styles.empty}>
                        <Typography variant="body-content" tag="p" size="s">
                          {!ocrData ? "Drag & Drop up to 30 bills" : "Drop invoice file here or click to upload"}
                        </Typography>
                        <Tooltip
                          overlayClassName="bill-fee__tooltip"
                          title="You can only upload one invoice file per bill. Any additional file can be uploaded under Attachment on payment details."
                          placement="top"
                          getPopupContainer={(triggerNode) => triggerNode.parentElement}
                        >
                          <InfoOutline className={styles.infoIcon} iconColor="var(--icon-default)" size="16" />
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
              </Upload.Dragger>
            );
          }}
        />
      )}
      {status === "done" && (
        <div className={styles.invoicePreview}>
          <Typography className={styles.invoiceTitle} variant="headline-content" size="l" tag="h3">
            Invoice
          </Typography>
          <div className={styles.invoice}>
            <a className={styles.link} rel="noopener noreferrer" href={fileUrl} target="_blank">
              {renderThumbnail(fileList[0], 665, 900)}
            </a>
            <div className={styles.action}>
              <Typography
                className={cn(styles.actionItem, styles.update)}
                variant="body-content"
                size="s"
                tag="p"
                onClick={handleUpdateFile}
              >
                <UploadOutline className={styles.actionIcon} iconColor="#0c75d2" size="16" />
                Change file
              </Typography>
              <Typography
                className={cn(styles.actionItem, styles.delete)}
                variant="body-content"
                size="s"
                tag="p"
                onClick={handleDeleteFile}
              >
                <DeleteOutline className={styles.actionIcon} iconColor="#e41b1b" size="16" />
                Delete
              </Typography>
            </div>
          </div>
        </div>
      )}

      {/*  TO DO: replace the size with the variable in the constants file */}
      {showField && (
        <div className={styles.hint}>Only PDF, PNG, and JPG formats are accepted. Max. file size : 10 MB per file</div>
      )}
    </div>
  );
};

export default Uploader;
