import React, { forwardRef, useMemo, useState } from "react";
import { Upload } from "antd";
import { UploadProps } from "antd/lib/upload";
import { RcCustomRequestOptions, RcFile, UploadFile } from "antd/lib/upload/interface";
import { ControllerRenderProps } from "react-hook-form";
import { Button, DeleteFilled, Typography } from "@spenmo/splice";
import { Document, Page } from "react-pdf";

import { UploadFile as UploadFileAction } from "Redux/DataCalls/UploadImage.api";
import { HTTP_STATUS_CODE } from "constants/HTTPStatusCode.constant";
import { uploadInvoice } from "assets/img";
import { UPLOAD_MAX_SIZE } from "Views/Bills/const";
import { ALLOWED_FILE_EXTENSIONS, ALLOWED_FILE_EXTENSIONS_FORMATTED } from "../../../../constants";

import { getAcceptedFiles, getUploadedFiles } from "Views/Bills/V2/utilities";

import styles from "./Attachment.module.scss";

interface FileItemProps {
  file: UploadFile;
  onDelete(): void;
}

const FileItem = (props: FileItemProps) => {
  const { file, onDelete } = props;
  const { name, size, response, status, type } = file;
  const { file_path } = response || {};

  const handleDeleteFile = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    onDelete();
  };

  const isDone = status === "done";
  const sizeMB = (size / 1024 / 1024).toFixed(3);
  const isPDF = type === "application/pdf";

  const handleClickPreview = (e) => {
    e.preventDefault();
    e.stopPropagation();

    window.open(file_path, "__blank");
  };

  const renderThumbnail = () => {
    if (isPDF) {
      return (
        <Document file={file_path}>
          <Page pageNumber={1} />
        </Document>
      );
    }

    return <img src={file_path} alt={name} width={143} height={174} />;
  };

  return (
    <div className={styles.fileItem}>
      <a
        className={styles.fileImg}
        rel="noopener noreferrer"
        href={file_path}
        target="_blank"
        onClick={handleClickPreview}
      >
        {isDone ? renderThumbnail() : <img src={uploadInvoice} alt={name} width={143} height={174} />}
      </a>
      <Typography className={styles.fileName} variant="body-content" size="caption-m" tag="p" weight={600}>
        {isDone ? name : "Uploading..."}
      </Typography>
      {isDone && (
        <>
          <div className={styles.fileInfo}>
            <Typography variant="body-content" size="caption-m">
              {sizeMB} MB
            </Typography>
          </div>
          <div className={styles.deleteIcon} tabIndex={0} aria-label="button" onClick={handleDeleteFile}>
            <DeleteFilled size="16" iconColor="#C2190A" />
          </div>
        </>
      )}
    </div>
  );
};

const Attachment = forwardRef(
  (props: Partial<UploadProps & ControllerRenderProps>, ref: React.RefObject<HTMLDivElement>) => {
    const { value, onChange } = props;

    // fileList is to hold all fileList (uploading, done files)
    const [fileList, setFileList] = useState([]);

    // probably need to use useEffect instead
    // but it will set the fileList twice in that case
    const defaultFileList: RcFile[] = useMemo(() => {
      return value?.map((file, index) => {
        const fileName = file.name;

        return {
          uid: "default-file" + index,
          name: fileName,
          status: "done",
          url: file,
        };
      });
    }, [value]);

    const validateFile = (file: any) => {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const extensionValid = ALLOWED_FILE_EXTENSIONS.includes(fileExtension);
      const sizeValid = file.size <= (4 / 10) * UPLOAD_MAX_SIZE; // 4 MB
      const isFileValid = extensionValid && sizeValid;

      return isFileValid;
    };

    const handleUploadRequest = (options: RcCustomRequestOptions) => {
      const { file, onSuccess, onError } = options;
      UploadFileAction(file)
        .then((res) => {
          const { status, payload } = res.data;
          if (status === HTTP_STATUS_CODE.OK) {
            return onSuccess(payload, file);
          }

          return onError(status);
        })
        .catch((error) => {
          onError(error);
        });
    };

    const handleUpload = (value) => {
      const { fileList } = value;

      // only setFileList on uploading / done
      // error should not be included
      setFileList(getAcceptedFiles(fileList));

      onChange(getUploadedFiles(fileList));
    };

    const handleDeleteFile = (fileIndex) => {
      setFileList((fileList) => {
        fileList.splice(fileIndex, 1);

        onChange(getUploadedFiles(fileList));
        return [...fileList];
      });
    };

    return (
      <Upload.Dragger
        {...props}
        listType="picture-card"
        className={styles.attachment}
        showUploadList={false}
        beforeUpload={validateFile}
        onChange={handleUpload}
        customRequest={handleUploadRequest}
        accept={ALLOWED_FILE_EXTENSIONS_FORMATTED}
        multiple
        defaultFileList={defaultFileList}
        fileList={fileList}
      >
        {fileList.length === 0 ? (
          <>
            <div>
              <img src={uploadInvoice} alt="upload" width={120} height={120} />
            </div>
            <Typography className={styles.desc} variant="body-content" size="s" tag="div" weight={600}>
              Drop your files here, or <span className={styles.highlight}>Choose Files</span>
            </Typography>
            <Typography className={styles.caption} variant="body-content" size="caption-m" tag="div">
              Upload any supporting documents here. We only accept PDF and PNG format. (Max. 4MB)
            </Typography>
          </>
        ) : (
          <div className={styles.fileContainer}>
            <div className={styles.fileList}>
              {fileList.map((file, fileIndex) => {
                return <FileItem key={fileIndex} file={file} onDelete={() => handleDeleteFile(fileIndex)} />;
              })}
            </div>
            <Button className={styles.addMoreFiles} variant="primary" size="s" type="button">
              Add More Files
            </Button>
          </div>
        )}
      </Upload.Dragger>
    );
  }
);

export default Attachment;
