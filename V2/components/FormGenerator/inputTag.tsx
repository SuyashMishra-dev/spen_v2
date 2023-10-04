import React from "react";
import TagInputSelect from "Modules/TagInput";

import { InputProps } from "antd/lib/input";

const InputTag = (props: InputProps) => {
  return <TagInputSelect {...props} />;
};

export default InputTag;
