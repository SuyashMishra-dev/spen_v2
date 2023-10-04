import React from "react";
import styles from "./Preview.module.scss";
import { Banner } from "@spenmo/splice";
import { IBannerProps } from "@spenmo/splice/lib/components/Banner";

export interface PreviewProps {
  data: {
    label: string;
    fields: {
      labelName: string;
      oldValue: string;
      newValue: string;
      isEdited: boolean;
    }[];
  }[];
  isEdited: boolean;
  banner?: IBannerProps;
}

const Preview: React.FC<PreviewProps> = ({ data, isEdited, banner }) => {
  return (
    <div className={styles.preview}>
      {banner && <Banner {...banner} />}
      {isEdited && (
        <div className={styles.previewLabel}>
          <div>
            <div className={styles.previewHighlight} />
            <div>Updated field(s)</div>
          </div>
          <div>
            <div className={styles.previewColor} />
            <span>Unchanged</span>
          </div>
        </div>
      )}
      {data.map((section) => (
        <div key={section.label} className={styles.previewSection} data-title={section.label}>
          <div className={styles.previewContent}>
            {section?.fields?.map((item) => (
              <div key={item.labelName} className={styles.previewItem}>
                <div>{item.labelName}</div>
                {item.isEdited ? (
                  <div>
                    <span className={styles.newValue}>{item.newValue}</span>
                    <span className={styles.oldValue}>{item.oldValue}</span>
                  </div>
                ) : (
                  <div>{item.newValue || "-"}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Preview;
