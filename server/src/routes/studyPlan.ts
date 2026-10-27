import { Router, Request, Response, NextFunction } from 'express';
import { geminiService } from '../services/geminiService';
import { validateDailyMinutes, ValidationError } from '../utils/validateInput';

export const studyPlanRouter = Router();

/**
 * POST /api/study-plan
 * Generates an adaptive study timetable targeting weak topics (<60% accuracy).
 */
studyPlanRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const weakTopics = Array.isArray(req.body.weakTopics) ? req.body.weakTopics : [];
      const strongTopics = Array.isArray(req.body.strongTopics) ? req.body.strongTopics : [];

      if (weakTopics.length === 0 && strongTopics.length === 0) {
        throw new ValidationError(
          'No topic performance data provided. Complete at least one quiz to evaluate topic strengths and weaknesses.'
        );
      }

      const dailyMinutes = validateDailyMinutes(req.body.dailyAvailableMinutes, 60);
      const targetExamDate = typeof req.body.targetExamDate === 'string' ? req.body.targetExamDate : '';
      const notesSnippet = typeof req.body.studyNotesSnippet === 'string' ? req.body.studyNotesSnippet : undefined;

      const plan = await geminiService.generateStudyPlan(
        weakTopics,
        strongTopics,
        targetExamDate,
        dailyMinutes,
        notesSnippet
      );

      res.status(200).json(plan);
    } catch (err) {
      next(err);
    }
  }
);
