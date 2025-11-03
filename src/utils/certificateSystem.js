// Certificates & Completion Tracking System
export const awardCertificate = (userEmail, certificateData) => {
  try {
    const certificatesKey = `mumayaz_certificates_${userEmail}`;
    const certificates = JSON.parse(localStorage.getItem(certificatesKey) || '[]');

    const certificate = {
      id: Date.now().toString(),
      ...certificateData,
      awardedAt: new Date().toISOString()
    };

    certificates.push(certificate);
    localStorage.setItem(certificatesKey, JSON.stringify(certificates));

    return certificate;
  } catch (error) {
    console.error('Error awarding certificate:', error);
  }
};

export const getCertificates = (userEmail) => {
  try {
    const certificatesKey = `mumayaz_certificates_${userEmail}`;
    return JSON.parse(localStorage.getItem(certificatesKey) || '[]');
  } catch (error) {
    console.error('Error getting certificates:', error);
    return [];
  }
};

export const trackCompletion = (userEmail, moduleType, moduleId) => {
  try {
    const completionKey = `mumayaz_completions_${userEmail}`;
    const completions = JSON.parse(localStorage.getItem(completionKey) || '{}');

    if (!completions[moduleType]) {
      completions[moduleType] = [];
    }

    if (!completions[moduleType].includes(moduleId)) {
      completions[moduleType].push(moduleId);
      localStorage.setItem(completionKey, JSON.stringify(completions));

      // Check if certificate should be awarded
      checkCertificateEligibility(userEmail, moduleType, completions[moduleType].length);
    }
  } catch (error) {
    console.error('Error tracking completion:', error);
  }
};

export const getCompletionRate = (userEmail, moduleType) => {
  try {
    const completionKey = `mumayaz_completions_${userEmail}`;
    const completions = JSON.parse(localStorage.getItem(completionKey) || '{}');

    const completed = completions[moduleType]?.length || 0;
    const total = getModuleTotalItems(moduleType);

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  } catch (error) {
    console.error('Error getting completion rate:', error);
    return 0;
  }
};

const getModuleTotalItems = (moduleType) => {
  const totals = {
    'alphabet': 28,
    'colors': 10,
    'words': 50,
    'sentences': 30
  };
  return totals[moduleType] || 0;
};

const checkCertificateEligibility = (userEmail, moduleType, completedCount) => {
  const total = getModuleTotalItems(moduleType);

  if (completedCount >= total) {
    const title = moduleType.charAt(0).toUpperCase() + moduleType.slice(1);
    awardCertificate(userEmail, {
      type: moduleType,
      title: `${title} Completion`,
      description: `Completed all ${total} items in ${moduleType} module`
    });
  }
};
