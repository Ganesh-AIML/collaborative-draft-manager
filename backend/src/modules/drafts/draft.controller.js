const draftService = require('./draft.service');
const { createDraftSchema, updateDraftSchema } = require('./draft.validation');
const { listDraftsQuerySchema } = require('./draft.query.validation');

// Handles POST /drafts — validates and creates a draft
async function create(req, res, next) {
  try {
    const { error, value } = createDraftSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }
    const draft = await draftService.createDraft(value);
    res.set('ETag', `"${draft.version}"`);
    res.status(201).json({ success: true, message: 'Draft created', data: draft });
  } catch (err) {
    next(err);
  }
}

// Handles GET /drafts/:id — fetches a single draft, sets ETag from version
async function getOne(req, res, next) {
  try {
    const draft = await draftService.getDraftById(req.params.id);
    res.set('ETag', `"${draft.version}"`);
    res.json({ success: true, message: 'Draft fetched', data: draft });
  } catch (err) {
    next(err);
  }
}

// Handles GET /drafts — validates query, returns paginated/searchable drafts
async function getAll(req, res, next) {
  try {
    const { error, value } = listDraftsQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { items, meta } = await draftService.listDrafts(value);
    res.json({ success: true, message: 'Drafts fetched successfully.', data: items, meta });
  } catch (err) {
    next(err);
  }
}

// Handles PUT /drafts/:id — validates, enforces If-Match version, updates
async function update(req, res, next) {
  try {
    const { error, value } = updateDraftSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const rawIfMatch = req.get('If-Match');
    const ifMatchVersion = rawIfMatch ? rawIfMatch.replace(/"/g, '') : undefined;

    const draft = await draftService.updateDraft(req.params.id, value, ifMatchVersion);
    res.set('ETag', `"${draft.version}"`);
    res.json({ success: true, message: 'Draft updated', data: draft });
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({
        success: false,
        message: err.message,
        currentVersion: err.currentVersion,
      });
    }
    next(err);
  }
}

// Handles DELETE /drafts/:id — deletes a draft
async function remove(req, res, next) {
  try {
    await draftService.deleteDraft(req.params.id);
    res.json({ success: true, message: 'Draft deleted', data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getOne, getAll, update, remove };