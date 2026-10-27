import { Router, Request, Response, NextFunction } from 'express';
import { geminiService } from '../services/geminiService';
import { validateStudyText, validateQuestionCount } from '../utils/validateInput';

export const quizRouter = Router();

/**
 * POST /api/quiz
 * Generates conceptual multiple-choice questions from the supplied study text.
 */
quizRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const text = validateStudyText(req.body.text, 'text');
      const questionCount = validateQuestionCount(req.body.questionCount, 5);

      const quiz = await geminiService.generateQuiz(text, questionCount);
      res.status(200).json(quiz);
    } catch (err) {
      next(err);
    }
  }
);
