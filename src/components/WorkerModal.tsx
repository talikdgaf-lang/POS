import React, { useState, useMemo } from 'react';
import { X, User, Lock, Briefcase, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { Employee } from '../types';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';

interface WorkerModalProps {
  onClose: () => void;
  onLogin?: (employee: Employee) => void;
  employees?: Employee[];
}

export const WorkerModal: React.FC<WorkerModalProps> = ({ onClose, onLogin, employees }) => {
  // Authoritative employee list: prioritize props, then localStorage, excluding any mockups
  const registeredEmployees = useMemo<Employee[]>(() => {
    let list: Employee[] = [];
    if (employees && Array.isArray(employees)) {
      list = employees;
    } else {
      try {
        const saved = localStorage.getItem('beverage_hub_employees');
        if (saved !== null) {
          const parsed: Employee[] = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            list = parsed;
          }
        }
      } catch (e) {
        console.error('Error reading employees from localStorage', e);
      }
    }
    return list.filter(
      (emp) =>
        !['emp-1', 'emp-2', 'emp-3', 'emp-4'].includes(emp.id) &&
        !['Daniel K.', 'Alex Mercer', 'Sarah Jenkins', 'Michael Scott'].includes(emp.name)
    );
  }, [employees]);

  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [typedName, setTypedName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Selected employee from dropdown
  const selectedEmployee = useMemo(() => {
    if (selectedStaffId) {
      return registeredEmployees.find((emp) => emp.id === selectedStaffId) || null;
    }
    if (typedName.trim()) {
      const q = typedName.trim().toLowerCase();
      return (
        registeredEmployees.find(
          (emp) =>
            emp.name.trim().toLowerCase() === q ||
            emp.staffId?.trim().toLowerCase() === q ||
            (emp.nationalId && emp.nationalId.trim().toLowerCase() === q)
        ) || null
      );
    }
    return null;
  }, [selectedStaffId, typedName, registeredEmployees]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStaffId(val);
    setErrorMessage('');
    if (val) {
      const emp = registeredEmployees.find((item) => item.id === val);
      if (emp) {
        setTypedName(emp.name);
      }
    } else {
      setTypedName('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Determine target employee
    let targetEmployee = selectedEmployee;

    if (!targetEmployee && typedName.trim()) {
      const q = typedName.trim().toLowerCase();
      targetEmployee =
        registeredEmployees.find(
          (emp) =>
            emp.name.trim().toLowerCase() === q ||
            emp.staffId?.trim().toLowerCase() === q ||
            (emp.nationalId && emp.nationalId.trim().toLowerCase() === q)
        ) || null;
    }

    if (!targetEmployee) {
      setErrorMessage('Worker not found. Please select your name or register in Manager Portal.');
      return;
    }

    const trimmedPin = pin.trim();
    if (!trimmedPin) {
      setErrorMessage('Please enter your worker PIN.');
      return;
    }

    // Check PIN (default is '1234' or what was set during registration)
    const validPin = targetEmployee.pin || '1234';
    if (trimmedPin !== validPin) {
      setErrorMessage('Incorrect PIN. Please try again.');
      return;
    }

    // Success
    setSuccessMessage(`Welcome, ${targetEmployee.name} (${targetEmployee.role})`);
    setTimeout(() => {
      if (onLogin) {
        onLogin(targetEmployee);
      } else {
        onClose();
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-[390px] bg-white rounded-3xl shadow-2xl p-6 sm:p-7 relative flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 text-gray-400 hover:text-black transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Worker Icon & Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mb-3 shadow-sm">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-black tracking-tight">Worker Login</h2>
            <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Select your name and enter PIN</p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="w-full mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-medium text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="w-full mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          {/* Worker Select Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Staff Member
            </label>
            <div className="relative flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
              <User className="w-4 h-4 text-gray-600 shrink-0 mr-2.5" />
              <select
                value={selectedStaffId}
                onChange={handleSelectChange}
                className="w-full bg-transparent text-sm font-medium text-black outline-none appearance-none cursor-pointer pr-6"
              >
                <option value="">Choose your name...</option>
                {registeredEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role} {emp.staffId ? `(${emp.staffId})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none absolute right-3.5" />
            </div>
          </div>

          {/* Or manual typed name if worker is not selected */}
          {!selectedStaffId && (
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Or Type Name / ID
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                <input
                  type="text"
                  placeholder="Enter worker name or staff ID"
                  value={typedName}
                  onChange={(e) => {
                    setTypedName(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full bg-transparent text-sm font-medium text-black placeholder:text-gray-400 outline-none"
                />
              </div>
            </div>
          )}

          {/* Role badge indicator when matched */}
          {selectedEmployee && (
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span className="text-gray-600">Assigned Role:</span>
              </div>
              <span className="font-bold text-black bg-white px-2.5 py-0.5 rounded-md border border-gray-200">
                {selectedEmployee.role}
              </span>
            </div>
          )}

          {/* PIN Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Worker PIN
              </label>
              <span className="text-[10px] text-gray-600 font-medium">Default: 1234</span>
            </div>
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
              <Lock className="w-4 h-4 text-gray-600 shrink-0 mr-2.5" />
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                required
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full bg-transparent text-sm font-bold text-black placeholder:text-gray-400 outline-none font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-gray-400 hover:text-black transition-colors cursor-pointer ml-2 p-0.5"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 bg-black hover:bg-neutral-900 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <span>Log In</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
          </button>
        </form>
      </div>
    </div>
  );
};
