import React, { useState, useEffect } from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';
import Papa from 'papaparse';

const AddStudentsCSV = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [studentCount, setStudentCount] = useState(0);

  // Fetch student count on mount and after operations
  useEffect(() => {
    const fetchStudentCount = async () => {
      try {
        const db = firebase.firestore();
        const studentsSnapshot = await db.collection('students').get();
        setStudentCount(studentsSnapshot.size);
      } catch (error) {
        console.error('Error fetching student count:', error);
      }
    };
    fetchStudentCount();
  }, []);

  const handleFileChange = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
      setSuccess('');
    } else {
      setError('Please upload a valid CSV file.');
      setFile(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('No file selected.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transform: (value) => value.trim(),
      complete: async (result) => {
        const students = result.data;
        const db = firebase.firestore();
        const batch = db.batch();

        try {
          students.forEach((student, index) => {
            const { uname, tokenNo, password } = student;
            if (uname && tokenNo !== undefined && password !== undefined) {
              const studentRef = db.collection('students').doc();
              batch.set(studentRef, {
                uname: uname.trim(),
                tokenNo: parseInt(tokenNo, 10) || tokenNo,
                password: password.toString(),
                block: false,
                obj: {
                  lunch: {
                    su: true,
                    mo: true,
                    tu: true,
                    we: true,
                    th: true,
                    fr: true,
                    sa: true,
                  },
                  breakfast: {
                    su: true,
                    mo: true,
                    tu: true,
                    we: true,
                    th: true,
                    fr: true,
                    sa: true,
                  },
                },
                obj2: {
                  beef: true,
                  chicken: true,
                  fish: true,
                  mutton: true,
                },
              });
            } else {
              console.log(`Invalid row ${index + 1}:`, student);
              throw new Error(`Invalid CSV data: Missing required fields in row ${index + 1}.`);
            }
          });

          await batch.commit();
          setSuccess('Students added successfully!');
          // Update student count
          const studentsSnapshot = await db.collection('students').get();
          setStudentCount(studentsSnapshot.size);
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } catch (error) {
          setError(`Error adding students: ${error.message}`);
        } finally {
          setUploading(false);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setUploading(false);
      },
    });
  };

  const handleRemoveAll = async () => {
    if (!window.confirm('Are you sure you want to delete all students? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const db = firebase.firestore();
      const studentsSnapshot = await db.collection('students').get();
      const batch = db.batch();

      studentsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setSuccess('All students deleted successfully!');
      setStudentCount(0); // Update student count
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      setError(`Error deleting students: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const downloadSample = () => {
    const sampleData = [
      ['uname', 'tokenNo', 'password'],
      ['john_doe', '1', 'password123'],
      ['jane_smith', '2', 'securepass'],
      ['mike_wilson', '3', 'mypassword'],
    ];

    const csvContent = sampleData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_students.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
          </div>
          <p className="text-center text-gray-600 mt-2">Upload and manage student data via CSV</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <h2 className="text-lg font-semibold text-white">Upload Students</h2>
              </div>
            </div>

            <div className="p-6">
              {/* Status Messages */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  dragActive ? 'border-blue-500 bg-blue-50' : file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading || deleting}
                />
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {file ? (
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    )}
                  </div>
                  {file ? (
                    <div>
                      <p className="text-lg font-medium text-green-700">File Selected</p>
                      <p className="text-sm text-green-600">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-2">Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-700">Drop CSV file here</p>
                      <p className="text-sm text-gray-500">or click to browse</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CSV Format Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-2">CSV Format Requirements:</h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>
                    • <code className="bg-white px-1 rounded">uname</code> - Student username
                  </p>
                  <p>
                    • <code className="bg-white px-1 rounded">tokenNo</code> - Unique token number
                  </p>
                  <p>
                    • <code className="bg-white px-1 rounded">password</code> - Student password
                  </p>
                </div>
                <button
                  onClick={downloadSample}
                  className="mt-3 flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Download Sample CSV</span>
                </button>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploading || deleting}
                className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform ${
                  !file || uploading || deleting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                }`}
                title={!file ? 'Please select a CSV file to upload' : ''}
              >
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading Students...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span>Upload Students</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Management Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <h2 className="text-lg font-semibold text-white">Database Management</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Warning Section */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-yellow-800">Danger Zone</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This action will permanently delete all student records from the database.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Stats */}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">{studentCount}</p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={handleRemoveAll}
                  disabled={deleting || uploading || studentCount === 0}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform ${
                    deleting || uploading || studentCount === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                  }`}
                  title={studentCount === 0 ? 'No students to delete' : ''}
                >
                  {deleting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting All Students...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete All Students</span>
                    </div>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  This action cannot be undone. Please be certain before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentsCSV;