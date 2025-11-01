"use client"

import "../../styles/MedicineTable.css"
import { Prescription } from "../../types/medicalRecord.types";

interface MedicineTableProps {
  medicines: Prescription[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: keyof Prescription, value: any) => void;
}

export default function MedicineTable({ medicines, onDelete, onUpdate }: MedicineTableProps) {
  return (
    <div className="medicine-table-wrapper">
      <table className="medicine-table">
        <thead>
          <tr>
            <th>Tên thuốc</th>
            <th>Hàm lượng</th>
            <th>Tần suất</th>
            <th>Thời gian (ngày)</th>
            <th>Hướng dẫn</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((medicine) => (
            <tr key={medicine.id}>
              <td>
                <input
                  type="text"
                  value={medicine.medicationName}
                  onChange={(e) => onUpdate(medicine.id, "medicationName", e.target.value)}
                  className="table-input"
                  placeholder="Tên thuốc"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={medicine.dosage}
                  onChange={(e) => onUpdate(medicine.id, "dosage", e.target.value)}
                  className="table-input"
                  placeholder="500mg"
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
                <button className="btn-delete" onClick={() => onDelete(medicine.id)} title="Xóa">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}