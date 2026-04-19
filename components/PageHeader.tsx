
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  onBack, 
  rightElement, 
  children,
  className = "" 
}) => {
  const navigate = useNavigate();

  return (
    <header className={`px-6 pt-6 pb-3 sticky top-0 theme-card-bg z-20 border-b theme-border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack || (() => navigate(-1))} 
            className="p-1.5 -ml-1.5 theme-text-secondary active:scale-90 transition-transform"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-black theme-text-main leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-[10px] theme-primary-text font-black uppercase tracking-wider">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightElement && (
          <div className="flex items-center gap-1">
            {rightElement}
          </div>
        )}
      </div>
      {children && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
