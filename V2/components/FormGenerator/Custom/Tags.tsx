import React from "react";

import AccountingTags from "Modules/AccountingTags";

const Tags = (props) => {
  const { value, onChange } = props;

  return <AccountingTags onChange={onChange} initialTags={value} customLabel={<></>} />;
};

export default Tags;
