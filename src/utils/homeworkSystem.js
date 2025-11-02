/**
 * Homework & Assignment System
 * Manages assignments creation, submission, and grading
 */

import { playSuccessSound, playClickSound } from './soundEffects';

/**
 * Create a new assignment
 */
export const createAssignment = (teacherEmail, assignmentData) => {
  try {
    const assignments = JSON.parse(localStorage.getItem('mumayaz_assignments') || '{}');

    const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newAssignment = {
      id: assignmentId,
      ...assignmentData,
      teacherEmail,
      createdAt: new Date().toISOString(),
      submissions: {}
    };

    assignments[assignmentId] = newAssignment;
    localStorage.setItem('mumayaz_assignments', JSON.stringify(assignments));

    playSuccessSound();
    return newAssignment;
  } catch (error) {
    console.error('Error creating assignment:', error);
    return null;
  }
};

/**
 * Get all assignments for a user (teacher or student)
 */
export const getUserAssignments = (userEmail, userRole) => {
  try {
    const assignments = JSON.parse(localStorage.getItem('mumayaz_assignments') || '{}');

    return Object.values(assignments).filter(assignment => {
      if (userRole === 'teacher') {
        return assignment.teacherEmail === userEmail;
      } else {
        return assignment.assignedTo && assignment.assignedTo.includes(userEmail);
      }
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting assignments:', error);
    return [];
  }
};

/**
 * Submit assignment
 */
export const submitAssignment = (assignmentId, studentEmail, submissionData) => {
  try {
    const assignments = JSON.parse(localStorage.getItem('mumayaz_assignments') || '{}');
    const assignment = assignments[assignmentId];

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    assignment.submissions[studentEmail] = {
      submitted: true,
      submittedAt: new Date().toISOString(),
      ...submissionData,
      status: 'submitted'
    };

    assignments[assignmentId] = assignment;
    localStorage.setItem('mumayaz_assignments', JSON.stringify(assignments));

    playSuccessSound();
    return true;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return false;
  }
};

/**
 * Grade assignment
 */
export const gradeAssignment = (assignmentId, studentEmail, gradeData) => {
  try {
    const assignments = JSON.parse(localStorage.getItem('mumayaz_assignments') || '{}');
    const assignment = assignments[assignmentId];

    if (!assignment || !assignment.submissions[studentEmail]) {
      throw new Error('Submission not found');
    }

    assignment.submissions[studentEmail] = {
      ...assignment.submissions[studentEmail],
      ...gradeData,
      gradedAt: new Date().toISOString(),
      status: 'graded'
    };

    assignments[assignmentId] = assignment;
    localStorage.setItem('mumayaz_assignments', JSON.stringify(assignments));

    playSuccessSound();
    return true;
  } catch (error) {
    console.error('Error grading assignment:', error);
    return false;
  }
};

/**
 * Delete assignment
 */
export const deleteAssignment = (assignmentId) => {
  try {
    const assignments = JSON.parse(localStorage.getItem('mumayaz_assignments') || '{}');
    delete assignments[assignmentId];
    localStorage.setItem('mumayaz_assignments', JSON.stringify(assignments));
    playClickSound();
    return true;
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return false;
  }
};

/**
 * Get assignment statistics for a teacher
 */
export const getAssignmentStats = (teacherEmail) => {
  try {
    const assignments = getUserAssignments(teacherEmail, 'teacher');

    let totalAssignments = assignments.length;
    let totalSubmissions = 0;
    let avgScore = 0;
    let submissionCount = 0;

    assignments.forEach(assignment => {
      const submissions = Object.values(assignment.submissions || {});
      totalSubmissions += submissions.filter(s => s.submitted).length;

      submissions.forEach(submission => {
        if (submission.score !== undefined) {
          avgScore += submission.score;
          submissionCount++;
        }
      });
    });

    return {
      totalAssignments,
      totalSubmissions,
      avgScore: submissionCount > 0 ? Math.round(avgScore / submissionCount) : 0
    };
  } catch (error) {
    console.error('Error getting assignment stats:', error);
    return { totalAssignments: 0, totalSubmissions: 0, avgScore: 0 };
  }
};

export default {
  createAssignment,
  getUserAssignments,
  submitAssignment,
  gradeAssignment,
  deleteAssignment,
  getAssignmentStats
};
