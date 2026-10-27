/**
 * Study Plan Service
 * Manages active AI-generated revision schedules and task completion checkboxes.
 */

import { StudyPlan } from '../types';

const STORAGE_KEY = 'studypilot_active_study_plan';

export const studyPlanService = {
  /**
   * Retrieves the current active study plan.
   */
  getActivePlan(): StudyPlan | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Saves or overwrites the active study plan.
   */
  savePlan(plan: StudyPlan): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  },

  /**
   * Toggles the completion checkbox for a specific task.
   */
  toggleTask(taskId: string): StudyPlan | null {
    const plan = this.getActivePlan();
    if (!plan) return null;

    const updatedTasks = plan.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    const updatedPlan: StudyPlan = {
      ...plan,
      tasks: updatedTasks,
    };

    this.savePlan(updatedPlan);
    return updatedPlan;
  },

  /**
   * Clears the current active study plan.
   */
  clearPlan(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
