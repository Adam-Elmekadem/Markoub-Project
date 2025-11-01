export const Button = ({ children, variant = 'primary', size = 'md', onClick, className = '', ...props }) => {
  const baseStyles = ' rounded-lg backdrop-blur-md shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease inline-flex items-center justify-center transform';
  
  const variants = {
    primary: 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-500/80 hover:shadow-blue-400/80',
    secondary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/80 hover:shadow-orange-400/80',
    outline: ' text-blue-700 hover:bg-blue-700 hover:text-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
