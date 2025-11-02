export const Spinner = ({ size = 5, color = 'blue', className = '' }) => {
  const sizeClass = `w-${size} h-${size}`;
  return (
    <div className={`inline-block ${className}`}>
      <div className={`w-${size} h-${size} border-2 border-${color}-600 border-t-transparent rounded-full animate-spin`} />
    </div>
  );
};
