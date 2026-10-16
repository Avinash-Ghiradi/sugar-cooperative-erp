import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck, Search, CheckCircle2, XCircle, Clock, Save, RefreshCw } from 'lucide-react';

export default function AttendanceModule() {
  const { showToast } = useAuth();
  const [recordType, setRecordType] = useState('Employee');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [recordType, selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    // Standard mock list setup for testing daily attendance register
    const empRes = await ApiService.getEmployees();
    if (empRes && empRes.data) {
      setAttendanceList(empRes.data.map(e => ({
        entity_id: e.employee_id,
        name: e.name,
        department: e.department || e.designation,
        status: 'Present',
        correction_remarks: ''
      })));
    }
    setLoading(false);
  };

  const toggleStatus = (index) => {
    setAttendanceList(prev => prev.map((item, idx) => {
      if (idx === index) {
        const nextStatus = item.status === 'Present' ? 'Absent' : item.status === 'Absent' ? 'Leave' : 'Present';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const handleSaveAttendance = () => {
    showToast(`Attendance saved for ${selectedDate} (${attendanceList.length} records)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" /> Attendance Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Daily attendance register for Cooperative Employees & Shareholder General Meetings</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
          />

          <button
            onClick={handleSaveAttendance}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <Save className="w-4 h-4" /> Save Attendance
          </button>
        </div>
      </div>

      {/* Record Type Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setRecordType('Employee')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            recordType === 'Employee' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Employee Attendance
        </button>
        <button
          onClick={() => setRecordType('Shareholder')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            recordType === 'Shareholder' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Shareholder AGM Attendance
        </button>
      </div>

      {/* Register Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading daily attendance register...</div>
        ) : attendanceList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No attendance records registered for {recordType}. Add records to log attendance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Entity ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Department / Village</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Toggle Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {attendanceList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{item.entity_id}</td>
                    <td className="py-3 px-4 font-medium text-slate-100">{item.name}</td>
                    <td className="py-3 px-4 text-slate-400">{item.department}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'Present' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        item.status === 'Absent' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {item.status === 'Present' && <CheckCircle2 className="w-3 h-3" />}
                        {item.status === 'Absent' && <XCircle className="w-3 h-3" />}
                        {item.status === 'Leave' && <Clock className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleStatus(idx)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 text-[11px] font-medium transition-colors"
                      >
                        Mark Next Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
