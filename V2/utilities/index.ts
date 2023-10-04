import moment from "moment";
import { UploadFile } from "antd/lib/upload/interface";

export const formatDate = (date: number) => {
  return moment.unix(date).format("DD MMM YYYY [at] hh:mm a");
};

export const getResponsePayload = <T extends unknown>(data: { data: { payload: T } }): T | undefined => {
  return data?.data?.payload;
};

export const omitKey = <T>(obj: T, keyToOmit: keyof T) => {
  const { [keyToOmit]: omittedKey, ...newObj } = obj;
  return newObj;
};

/**
 * This function is to get fileList without error status for Antd Upload
 * @param fileList Antd UploadFile
 * @returns array of UploadFile
 */
export const getAcceptedFiles = (fileList: UploadFile[]) => {
  return fileList.filter((file) => file.status && file.status !== "error");
};

/**
 * This function is to get fileList with done status for AntdUpload
 * @param fileList Antd UploadFile
 * @returns array of file object
 */
export const getUploadedFiles = (fileList: UploadFile[]) => {
  return fileList.filter((file) => file.status === "done").map((file) => file.originFileObj);
};
