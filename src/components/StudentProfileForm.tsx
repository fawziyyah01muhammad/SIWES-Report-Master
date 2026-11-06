import React, { useState } from 'react';
import { User, Building, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { StudentInfo } from '../types/siwes';

interface StudentProfileFormProps {
  studentInfo: StudentInfo;
  onChange: (info: StudentInfo) => void;
}

export const StudentProfileForm: React.FC<StudentProfileFormProps> = ({
  studentInfo,
  onChange,
}) => {
  const [isSupervisorsExpanded, setIsSupervisorsExpanded] = useState(false);

  const handleChange = (field: keyof StudentInfo, value: string) => {
    onChange({
      ...studentInfo,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-rose-50 to-white px-4 py-3 border-b border-rose-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-md bg-[#6B1522] text-white flex items-center justify-center text-xs font-bold">
            1
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-gray-900">
              Student & Attachment Details
            </h3>
            <p className="text-[11px] text-gray-500">
              Required for the official title page and certification approval sheet
            </p>
          </div>
        </div>
        <span className="text-xs text-[#801828] font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          Cover Page
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Row 1: Student Name & Matric */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Student Full Name <span className="text-[#801828]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Babatunde Emmanuel Adeleke"
                value={studentInfo.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Matriculation / Reg Number <span className="text-[#801828]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 19/ENG04/052 or U2018/5570021"
              value={studentInfo.matricNo}
              onChange={(e) => handleChange('matricNo', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
              required
            />
          </div>
        </div>

        {/* Row 2: Institution & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Higher Institution <span className="text-[#801828]">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. University of Lagos / FUTO / ABU Zaria"
                value={studentInfo.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Department & Course of Study <span className="text-[#801828]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Electrical & Electronic Engineering"
              value={studentInfo.department}
              onChange={(e) => handleChange('department', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
              required
            />
          </div>
        </div>

        {/* Row 3: Faculty, Level & Academic Session */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Faculty / School
            </label>
            <input
              type="text"
              placeholder="e.g. Faculty of Engineering / Life Sciences"
              value={studentInfo.faculty}
              onChange={(e) => handleChange('faculty', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Level of Study
            </label>
            <select
              value={studentInfo.level}
              onChange={(e) => handleChange('level', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
            >
              <option value="400 Level (SIWES II)">400 Level (SIWES II)</option>
              <option value="300 Level (SIWES I)">300 Level (SIWES I)</option>
              <option value="200 Level (Introductory IT)">200 Level (Introductory IT)</option>
              <option value="HND II (Polytechnic)">HND II (Polytechnic)</option>
              <option value="ND II (Polytechnic)">ND II (Polytechnic)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span>Academic Session / Year</span>
              <span className="text-[10px] text-[#801828] font-medium">Custom</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. 2025/2026 or 2023/2024"
                value={studentInfo.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Host Establishment Details */}
        <div className="pt-2 border-t border-gray-100">
          <h4 className="text-xs font-bold text-[#801828] uppercase tracking-wider mb-2.5">
            Host Establishment & Placement
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Company / Organization Name <span className="text-[#801828]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Telecommunications Network Hub / Engineering Firm"
                value={studentInfo.hostOrg}
                onChange={(e) => handleChange('hostOrg', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assigned Unit / Department
              </label>
              <input
                type="text"
                placeholder="e.g. Network Infrastructure & Systems Support"
                value={studentInfo.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Establishment Location / Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Plot 14, Commercial Avenue, Ikeja, Lagos"
                  value={studentInfo.hostAddress}
                  onChange={(e) => handleChange('hostAddress', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Duration & Period
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. 6 Months (May - Oct)"
                  value={studentInfo.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optional Supervisors Expandable */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsSupervisorsExpanded(!isSupervisorsExpanded)}
            className="text-xs text-[#801828] hover:text-[#6B1522] font-semibold flex items-center space-x-1"
          >
            <span>{isSupervisorsExpanded ? 'Hide Supervisor Names' : '+ Add Signatory Names (For Certification Page)'}</span>
            {isSupervisorsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isSupervisorsExpanded && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Industry-based Supervisor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engr. O. A. Adeleke (FNSE)"
                  value={studentInfo.industrySupervisor}
                  onChange={(e) => handleChange('industrySupervisor', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Departmental Supervisor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. M. Ibrahim"
                  value={studentInfo.academicSupervisor}
                  onChange={(e) => handleChange('academicSupervisor', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Head of Department (HOD)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prof. A. S. Balogun"
                  value={studentInfo.headOfDepartment || ''}
                  onChange={(e) => handleChange('headOfDepartment', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] text-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
