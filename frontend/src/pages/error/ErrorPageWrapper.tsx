import React from 'react';
import { useParams } from 'react-router-dom';
import ErrorPage from './ErrorPage';

const ErrorPageWrapper: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const errorCode = parseInt(code || '500', 10);

  return <ErrorPage code={errorCode} />;
};

export default ErrorPageWrapper;
