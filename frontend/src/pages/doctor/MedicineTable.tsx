"use client"

import React, { useState } from 'react';
import "../../styles/doctor/MedicineTable.css"
import { Prescription } from "../../types/medicalRecord.types";

interface MedicineTableProps {
  medicines: Prescription[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: keyof Prescription, value: any) => void;
  isEditable: boolean;
}

interface MedicationDetailsModalProps {
  prescription: Prescription;
  onClose: () => void;
  onUpdate: (id: string, field: keyof Prescription, value: any) => void;
}

export default function MedicineTable({ medicines, onDelete, onUpdate, isEditable }: MedicineTableProps) {
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
                {/* Thay thế component tìm kiếm bằng input text thông thường */}
                <input
                  type="text"
                  value={medicine.medicationName}
                  onChange={(e) => onUpdate(medicine.id, "medicationName", e.target.value)}
                  className="table-input"
                  placeholder="Nhập tên thuốc"
                  disabled={!isEditable}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={medicine.dosage}
                  onChange={(e) => onUpdate(medicine.id, "dosage", e.target.value)}
                  className="table-input"
                  placeholder="Viên"
                  disabled={!isEditable}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={medicine.frequency}
                  onChange={(e) => onUpdate(medicine.id, "frequency", e.target.value)}
                  className="table-input"
                  placeholder="VD: 2 lần/ngày"
                  disabled={!isEditable}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={medicine.duration}
                  onChange={(e) => onUpdate(medicine.id, "duration", e.target.value)}
                  className="table-input"
                  placeholder="VD: 7 ngày"
                  disabled={!isEditable}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={medicine.instructions}
                  onChange={(e) => onUpdate(medicine.id, "instructions", e.target.value)}
                  className="table-input"
                  placeholder="VD: Sau ăn"
                  disabled={!isEditable}
                />
              </td>
              
              <td>
                {isEditable && (
                  <button className="btn-delete" onClick={() => onDelete(medicine.id)} title="Xóa">
                    ✕
                  </button>
                )}
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