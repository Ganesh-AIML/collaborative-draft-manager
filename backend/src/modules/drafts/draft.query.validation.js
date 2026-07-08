const Joi = require('joi');

// Validates query params for list/search/pagination
const listDraftsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  search: Joi.string().allow('').optional(),
});

module.exports = { listDraftsQuerySchema };