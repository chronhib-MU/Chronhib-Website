import React from 'react';
import { Spinner } from 'reactstrap';
import './Loading.scss';
function Loading() {
  return (
    <div className="text-center mb-2 mt-2">
      <Spinner style={{ width: '3rem', height: '3rem' }} color="dark" />
    </div>
  );
}
export default Loading;
