import React from 'react';
import AsyncSelect from 'react-select/async';
import { SingleValue, StylesConfig } from 'react-select';
import { medicationService, MedicationSearchResult } from '../../services/medicationService';
import { debounce } from 'lodash';

interface MedicineSearchableInputProps {
  value: string;
  onSelect: (medicine: MedicationSearchResult) => void;
}

interface SelectOption {
  label: string;
  value: MedicationSearchResult | null;
}

const MedicineSearchableInput: React.FC<MedicineSearchableInputProps> = ({ value, onSelect }) => {
  const loadOptions = async (inputValue: string): Promise<SelectOption[]> => {
    if (!inputValue || inputValue.trim().length < 2) return [];
    const results = await medicationService.searchMedications(inputValue);
    return results.map(med => ({
      label: `${med.name} (${med.dosage || 'N/A'})`,
      value: med,
    }));
  };

  // debounce để giảm số lần gọi API
  const debouncedLoadOptions = debounce(
    (inputValue: string, callback: (options: SelectOption[]) => void) => {
      loadOptions(inputValue).then(callback);
    },
    300
  );

  const handleChange = (selectedOption: SingleValue<SelectOption>) => {
    if (selectedOption && selectedOption.value) {
      onSelect(selectedOption.value);
    }
  };

  // ✅ Khai báo styles có kiểu rõ ràng
  const customStyles: StylesConfig<SelectOption, false> = {
    // Dùng menuPortal để đảm bảo zIndex hoạt động khi menu được render ra ngoài
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  // 🩹 Ép kiểu để TS hiểu đúng AsyncSelect (fix TS2786)
  const AsyncSelectComponent = AsyncSelect as unknown as React.ComponentType<any>;

  return (
    <AsyncSelectComponent
      cacheOptions
      defaultOptions={false}
      loadOptions={debouncedLoadOptions}
      onChange={handleChange}
      placeholder={value || 'Gõ để tìm thuốc...'}
      noOptionsMessage={({ inputValue }: any) =>
        inputValue.length < 2 ? 'Gõ ít nhất 2 ký tự' : 'Không tìm thấy thuốc'
      }
      styles={customStyles}
      // ✅ Dịch chuyển menu ra ngoài body để không bị che khuất
      menuPortalTarget={document.body}
    />
  );
};

export default MedicineSearchableInput;
