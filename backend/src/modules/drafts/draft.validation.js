const Joi = require('joi');

// Validates payload for creating a draft
const createDraftSchema = Joi.object({
  title: Joi.string().max(255).required(),
  content: Joi.string().required(),
});

// Validates payload for updating a draft (version comes via If-Match header, not body)
const updateDraftSchema = Joi.object({
  title: Joi.string().max(255),
  content: Joi.string(),
});

module.exports = { createDraftSchema, updateDraftSchema };