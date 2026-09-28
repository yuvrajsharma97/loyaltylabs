import { PuffLoader } from 'react-spinners';

const LoadingSpinner = ({ size = 48, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <PuffLoader color="#2B5748" size={size} />
    </div>
  );
};

export default LoadingSpinner;
