'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { SingleValue, StylesConfig, InputActionMeta } from 'react-select';
import { medicationService, MedicationSearchResult } from '../../services/medicationService';
import { debounce } from 'lodash';

interface MedicineSearchableInputProps {
  value: string;
  onInputChange: (value: string) => void;
  onSelect: (medicine: MedicationSearchResult) => void;
  disabled?: boolean;
}

interface SelectOption {
  label: string;
  value: MedicationSearchResult | null;
}

const formatMedicationLabel = (med: MedicationSearchResult) => med.name;

const MedicineSearchableInput: React.FC<MedicineSearchableInputProps> = ({
  value,
  onInputChange,
  onSelect,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [optionsSnapshot, setOptionsSnapshot] = useState<SelectOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);
  const skipSyncRef = useRef(false);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    if (value) {
      setSelectedOption({ label: value, value: null });
      setInputValue('');
    } else {
      setSelectedOption(null);
      setInputValue('');
    }
  }, [value]);

  const loadOptions = useCallback(async (searchTerm: string): Promise<SelectOption[]> => {
    if (!searchTerm || searchTerm.trim().length < 2) return [];
    const results = await medicationService.searchMedications(searchTerm.trim());
    return results.map((med) => ({
      label: formatMedicationLabel(med),
      value: med,
    }));
  }, []);

  const debouncedLoadOptions = useMemo(
    () =>
      debounce((searchTerm: string, callback: (options: SelectOption[]) => void) => {
        loadOptions(searchTerm).then((options) => {
          setOptionsSnapshot(options);
          callback(options);
        });
      }, 300),
    [loadOptions]
  );

  useEffect(() => () => debouncedLoadOptions.cancel(), [debouncedLoadOptions]);

  const applySelection = (medication: MedicationSearchResult) => {
    const option = { label: formatMedicationLabel(medication), value: medication };
    setSelectedOption(option);
    skipSyncRef.current = true;
    onSelect(medication); 
    setInputValue('');
  };

  const handleSelectChange = (selected: SingleValue<SelectOption>) => {
    if (selected?.value) {
      applySelection(selected.value);
    } else {
      setSelectedOption(null);
      onInputChange('');
      setInputValue('');
    }
  };

  const handleInputChange = (newValue: string, meta: InputActionMeta) => {
    if (meta.action === 'input-change') {
      setSelectedOption(null);
      setInputValue(newValue);
    }
    return newValue;
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && optionsSnapshot.length > 0) {
      event.preventDefault();
      const suggestion = optionsSnapshot[0];
      if (suggestion.value) {
        applySelection(suggestion.value);
      }
    }
  };

  const customStyles: StylesConfig<SelectOption, false> = {
    container: (base) => ({
      ...base,
      width: '100%',
    }),
    control: (base) => ({
      ...base,
      minHeight: '38px',
      borderColor: '#d1d5db',
      boxShadow: 'none',
      '&:hover': { borderColor: '#9ca3af' },
      fontSize: '14px',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
    }),
  };

  const AsyncSelectComponent = AsyncSelect as unknown as React.ComponentType<any>;

  return (
    <AsyncSelectComponent
      isDisabled={disabled}
      isClearable
      blurInputOnSelect={false}
      cacheOptions
      defaultOptions={false}
      loadOptions={(searchTerm: string, callback: (options: SelectOption[]) => void) =>
        debouncedLoadOptions(searchTerm, callback)
      }
      onChange={handleSelectChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onBlur={() => {
        if (!selectedOption) {
          onInputChange(inputValue.trim());
        }
      }}
      value={selectedOption}
      onKeyDown={handleKeyDown}
      placeholder="Nhập tên thuốc"
      noOptionsMessage={({ inputValue }: any) =>
        inputValue.length < 2 ? 'Gõ ít nhất 2 ký tự' : 'Không tìm thấy thuốc'
      }
      styles={customStyles}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
    />
  );
};

export default MedicineSearchableInput;
