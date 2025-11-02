import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportUserData, importUserData, clearAllUserData } from '../utils/dataExport';
import { playClickSound, playSuccessSound, playErrorSound } from '../utils/soundEffects';
import './DataManagement.css';

const DataManagement = ({ userEmail, language = 'en', onClose }) => {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const translations = {
    en: {
      title: 'Data Management',
      exportTitle: 'Export Your Data',
      exportDesc: 'Download all your learning progress, points, and achievements',
      exportButton: 'Download Data',
      importTitle: 'Import Data',
      importDesc: 'Restore your data from a previously exported file',
      importButton: 'Choose File',
      clearTitle: 'Clear All Data',
      clearDesc: 'Permanently delete all your data (cannot be undone)',
      clearButton: 'Delete All Data',
      close: 'Close',
      importSuccess: 'Data imported successfully!',
      importError: 'Failed to import data',
      exportSuccess: 'Data exported successfully!'
    },
    ar: {
      title: 'إدارة البيانات',
      exportTitle: 'تصدير البيانات',
      exportDesc: 'تحميل جميع تقدمك ونقاطك وإنجازاتك',
      exportButton: 'تحميل البيانات',
      importTitle: 'استيراد البيانات',
      importDesc: 'استعادة بياناتك من ملف محفوظ سابقاً',
      importButton: 'اختر ملف',
      clearTitle: 'مسح جميع البيانات',
      clearDesc: 'حذف جميع بياناتك بشكل نهائي (لا يمكن التراجع)',
      clearButton: 'حذف جميع البيانات',
      close: 'إغلاق',
      importSuccess: 'تم استيراد البيانات بنجاح!',
      importError: 'فشل استيراد البيانات',
      exportSuccess: 'تم تصدير البيانات بنجاح!'
    }
  };

  const t = translations[language] || translations.en;

  const handleExport = () => {
    playClickSound();
    const success = exportUserData(userEmail);
    if (success) {
      setTimeout(() => {
        alert(t.exportSuccess);
      }, 500);
    }
  };

  const handleImportClick = () => {
    playClickSound();
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    playClickSound();

    try {
      await importUserData(file, userEmail);
      playSuccessSound();
      alert(t.importSuccess);

      // Reload page to reflect imported data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Import error:', error);
      playErrorSound();
      alert(`${t.importError}: ${error.message}`);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearData = () => {
    playClickSound();
    const success = clearAllUserData(userEmail);
    if (success) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <motion.div
      className="data-management-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="data-management-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="data-management-header">
          <h2>💾 {t.title}</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="data-management-content">
          {/* Export Section */}
          <motion.div
            className="data-section export-section"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="section-icon">📥</div>
            <h3>{t.exportTitle}</h3>
            <p className="section-description">{t.exportDesc}</p>
            <button
              className="action-button export-button"
              onClick={handleExport}
            >
              {t.exportButton}
            </button>
          </motion.div>

          {/* Import Section */}
          <motion.div
            className="data-section import-section"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="section-icon">📤</div>
            <h3>{t.importTitle}</h3>
            <p className="section-description">{t.importDesc}</p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              className="action-button import-button"
              onClick={handleImportClick}
              disabled={importing}
            >
              {importing ? '⏳ Loading...' : t.importButton}
            </button>
          </motion.div>

          {/* Clear Data Section */}
          <motion.div
            className="data-section clear-section"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="section-icon">🗑️</div>
            <h3>{t.clearTitle}</h3>
            <p className="section-description danger-text">{t.clearDesc}</p>
            <button
              className="action-button clear-button"
              onClick={handleClearData}
            >
              {t.clearButton}
            </button>
          </motion.div>
        </div>

        <div className="data-management-footer">
          <button className="close-footer-button" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DataManagement;
