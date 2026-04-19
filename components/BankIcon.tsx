
import React from 'react';
import logo from '../src/assets/images/logo-piyes-ppl-wh-wh-svg.svg';

interface BankIconProps {
  logoUrl?: string;
  logoText: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: string;
  id?: string; // Ajout optionnel de l'ID pour identifier piYès
}

const BankIcon: React.FC<BankIconProps> = ({ 
  logoUrl, 
  logoText, 
  color, 
  size = 'md',
  className = '',
  rounded,
  id
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[8px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-lg'
  };

  const defaultRounded = {
    xs: 'rounded-full',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-[20px]'
  };

  const borderRadius = rounded || defaultRounded[size];

  // Détection robuste du compte piYès pour forcer le logo officiel
  const isPiyes = id?.toLowerCase().startsWith('piyes') || 
                  logoText.toLowerCase().includes('piyès') || 
                  logoText.toLowerCase().includes('piyes');

  const finalLogoUrl = isPiyes ? logo : logoUrl;

  return (
    <div 
      className={`flex items-center justify-center overflow-hidden shrink-0 shadow-sm ${sizeClasses[size]} ${borderRadius} ${className}`}
      style={{ backgroundColor: color }}
    >
      {finalLogoUrl ? (
        <img 
          src={finalLogoUrl} 
          alt={logoText} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              const span = document.createElement('span');
              span.className = 'font-black text-white';
              span.innerText = logoText[0];
              parent.appendChild(span);
            }
          }}
        />
      ) : (
        <span className="font-black text-white">{logoText[0]}</span>
      )}
    </div>
  );
};

export default BankIcon;
