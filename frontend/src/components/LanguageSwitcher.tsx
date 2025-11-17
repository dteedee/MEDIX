import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import styles from '../styles/components/LanguageSwitcher.module.css';

const options: { value: Language; label: string }[] = [
  { value: 'vi', label: 'VI' },
  { value: 'en', label: 'EN' },
];

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.switcher} role="group" aria-label="Language switcher">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.button} ${language === option.value ? styles.active : ''}`}
          onClick={() => setLanguage(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

