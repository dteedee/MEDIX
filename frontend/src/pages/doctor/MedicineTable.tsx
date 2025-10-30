"use client"

import React, { useState } from 'react';
import MedicineSearchableInput from './MedicineSearchableInput';
import { MedicationSearchResult } from '../../services/medicationService';
import "../../styles/MedicineTable.css"
import { Prescription } from "../../types/medicalRecord.types";

interface MedicineTableProps {
  medicines: Prescription[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: keyof Prescription, value: any) => void;
}

interface MedicationDetailsModalProps {
  prescription: Prescription;
  onClose: () => void;
  onUpdate: (id: string, field: keyof Prescription, value: any) => void;
}

const handleSelectMedicine = (id: string, onUpdate: MedicineTableProps['onUpdate']) => (medicine: MedicationSearchResult) => {
  // Khi người dùng chọn một thuốc từ danh sách gợi ý
  onUpdate(id, 'medicationId', medicine.id);
  onUpdate(id, 'medicationName', medicine.name);
  onUpdate(id, 'dosage', medicine.dosage || ''); // Tự động điền hàm lượng
};

export default function MedicineTable({ medicines, onDelete, onUpdate }: MedicineTableProps) {
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  return (
    <div className="medicine-table-wrapper">
      <table className="medicine-table">
        <thead>
          <tr>
            <th>Tên thuốc</th>
            <th>Hàm lượng</th>
            <th>Tần suất</th>
            <th>Thời gian</th>
            <th>Hướng dẫn</th>
            <th>Chi tiết</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((medicine) => (
            <tr key={medicine.id}>
              <td>
                {/* Thay thế input text bằng component tìm kiếm */}
                <MedicineSearchableInput
                  value={medicine.medicationName}
                  onSelect={handleSelectMedicine(medicine.id, onUpdate)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={medicine.dosage}
                  onChange={(e) => onUpdate(medicine.id, "dosage", e.target.value)}
                  className="table-input"
                  placeholder=""
                />
              </td>
              <td>
                <input
                  type="text"
                  value={medicine.frequency}
                  onChange={(e) => onUpdate(medicine.id, "frequency", e.target.value)}
                  className="table-input"
                  placeholder="2 lần/ngày"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={medicine.duration}
                  onChange={(e) => onUpdate(medicine.id, "duration", e.target.value)}
                  className="table-input"
                  placeholder="7 ngày"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={medicine.instructions}
                  onChange={(e) => onUpdate(medicine.id, "instructions", e.target.value)}
                  className="table-input"
                  placeholder="Sau ăn"
                />
              </td>
              <td>
                <button
                  type="button"
                  className="btn-details"
                  onClick={() => setSelectedPrescription(medicine)}
                  title="Xem chi tiết thuốc"
                >
                  Xem
                </button>
              </td>
              <td>
                <button className="btn-delete" onClick={() => onDelete(medicine.id)} title="Xóa">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedPrescription && (
        <MedicationDetailsModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}

const MedicationDetailsModal: React.FC<MedicationDetailsModalProps> = ({ prescription, onClose, onUpdate }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chi tiết thuốc: {prescription.medicationName}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="modal-form-group">
            <label className="modal-label">Tên gốc (Generic Name)</label>
            <textarea
              className="modal-textarea"
              value={prescription.genericName || ''}
              onChange={(e) => onUpdate(prescription.id, 'genericName', e.target.value)}
              rows={2}
              placeholder="Nhập tên gốc của thuốc..."
            />
          </div>
          <div className="modal-form-group">
            <label className="modal-label">Dạng bào chế (Dosage Forms)</label>
            <textarea
              className="modal-textarea"
              value={prescription.dosageForms || ''}
              onChange={(e) => onUpdate(prescription.id, 'dosageForms', e.target.value)}
              rows={2}
              placeholder="Viên nén, dung dịch tiêm,..."
            />
          </div>
          <div className="modal-form-group">
            <label className="modal-label">Công dụng chính (Common Uses)</label>
            <textarea
              className="modal-textarea"
              value={prescription.commonUses || ''}
              onChange={(e) => onUpdate(prescription.id, 'commonUses', e.target.value)}
              rows={4}
              placeholder="Chỉ định điều trị các trường hợp..."
            />
          </div>
          <div className="modal-form-group">
            <label className="modal-label">Tác dụng phụ (Side Effects)</label>
            <textarea
              className="modal-textarea"
              value={prescription.sideEffects || ''}
              onChange={(e) => onUpdate(prescription.id, 'sideEffects', e.target.value)}
              rows={4}
              placeholder="Các tác dụng không mong muốn có thể gặp..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};