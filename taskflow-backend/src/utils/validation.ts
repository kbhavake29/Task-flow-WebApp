import { body, param, query, ValidationChain } from 'express-validator';
import {
  EMAIL_REGEX,
  EMAIL_MAX_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  COMMON_PASSWORDS,
  TASK_STATUS,
} from './constants';

/**
 * Common validation chains
 */

// Email validation
export const emailValidation = (): ValidationChain =>
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isLength({ max: EMAIL_MAX_LENGTH })
    .withMessage(`Email must be at most ${EMAIL_MAX_LENGTH} characters`)
    .matches(EMAIL_REGEX)
    .withMessage('Invalid email format')
    .normalizeEmail();

// Password validation
export const passwordValidation = (): ValidationChain =>
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(
      `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`
    )
    .matches(PASSWORD_REGEX)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .custom((value) => {
      if (COMMON_PASSWORDS.has(value.toLowerCase())) {
        throw new Error('Password is too common, please choose a stronger password');
      }
      return true;
    });

// UUID validation
export const uuidValidation = (field: string = 'id'): ValidationChain =>
  param(field).isUUID(4).withMessage(`Invalid ${field} format`);

// Project validation
export const projectNameValidation = (isOptional = false): ValidationChain => {
  const validation = body('name')
    .trim()
    .customSanitizer((value) => {
      // Replace multiple spaces with single space
      return value.replace(/\s+/g, ' ').trim();
    });

  if (isOptional) {
    return validation
      .optional({ checkFalsy: true })
      .notEmpty()
      .withMessage('Project name cannot be empty')
      .isLength({ min: 1, max: 255 })
      .withMessage('Project name must be between 1 and 255 characters')
      .escape();
  }

  return validation
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be between 1 and 255 characters')
    .escape();
};

export const projectDescriptionValidation = (): ValidationChain =>
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((value) => {
      if (!value) return value;
      return value.replace(/\s+/g, ' ').trim();
    })
    .isLength({ max: 5000 })
    .withMessage('Description must be at most 5000 characters')
    .escape();

export const projectArchivedValidation = (): ValidationChain =>
  body('isArchived').optional().isBoolean().withMessage('isArchived must be a boolean');

// Task validation
export const taskTitleValidation = (isOptional = false): ValidationChain => {
  const validation = body('title')
    .trim()
    .customSanitizer((value) => {
      // Replace multiple spaces with single space
      return value.replace(/\s+/g, ' ').trim();
    });

  if (isOptional) {
    return validation
      .optional({ checkFalsy: true })
      .notEmpty()
      .withMessage('Task title cannot be empty')
      .isLength({ min: 1, max: 500 })
      .withMessage('Task title must be between 1 and 500 characters')
      .escape();
  }

  return validation
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Task title must be between 1 and 500 characters')
    .escape();
};

export const taskDueDateValidation = (): ValidationChain =>
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 datetime');

export const taskStatusValidation = (): ValidationChain =>
  body('status')
    .optional()
    .isIn([TASK_STATUS.PENDING, TASK_STATUS.COMPLETED])
    .withMessage(`Status must be either '${TASK_STATUS.PENDING}' or '${TASK_STATUS.COMPLETED}'`);

export const taskProjectIdValidation = (): ValidationChain =>
  body('projectId').notEmpty().withMessage('Project ID is required').isUUID(4).withMessage('Invalid project ID format');

// Query parameter validation
export const paginationValidation = () => [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Limit must be between 1 and 500')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt(),
];

export const sortValidation = (allowedFields: string[]) => [
  query('sort')
    .optional()
    .isIn(allowedFields)
    .withMessage(`Sort field must be one of: ${allowedFields.join(', ')}`),
  query('order').optional().isIn(['asc', 'desc']).withMessage("Order must be 'asc' or 'desc'"),
];

// Profile validation
export const profileNameValidation = (): ValidationChain =>
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((value) => {
      if (!value) return value;
      return value.replace(/\s+/g, ' ').trim();
    })
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters')
    .escape();

export const profileEmailValidation = (): ValidationChain =>
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isLength({ max: EMAIL_MAX_LENGTH })
    .withMessage(`Email must be at most ${EMAIL_MAX_LENGTH} characters`)
    .matches(EMAIL_REGEX)
    .withMessage('Invalid email format')
    .normalizeEmail();

export const currentPasswordValidation = (): ValidationChain =>
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required');

export const newPasswordValidation = (): ValidationChain =>
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`)
    .matches(PASSWORD_REGEX)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value) => !COMMON_PASSWORDS.has(value.toLowerCase()))
    .withMessage('Password is too common');

// Bulk task update validation
export const bulkTaskIdsValidation = (): ValidationChain =>
  body('taskIds')
    .notEmpty()
    .withMessage('Task IDs are required')
    .isArray({ min: 1 })
    .withMessage('Task IDs must be a non-empty array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      // Check each ID is a valid UUID
      return value.every((id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
    })
    .withMessage('All task IDs must be valid UUIDs');

export const bulkTaskStatusValidation = (): ValidationChain =>
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([TASK_STATUS.PENDING, TASK_STATUS.COMPLETED])
    .withMessage(`Status must be either '${TASK_STATUS.PENDING}' or '${TASK_STATUS.COMPLETED}'`);
