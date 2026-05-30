import React from 'react';
import { Download } from 'lucide-react';
import { exportToCSV } from '../utils/helpers';
import { useAttendance } from '../context/AttendanceContext';

export default function ExportButton() {
  const { subjects, profile } = useAttendance();

  const handleExport = () => {
    exportToCSV(subjects, profile);
  };

  return (
    <button className="btn btn-outline" onClick={handleExport} id="export-csv-btn">
      <Download size={16} />
      Export CSV
    </button>
  );
}
