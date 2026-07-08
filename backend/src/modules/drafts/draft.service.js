const draftModel = require('./draft.model');

// Creates a new draft via model layer
async function createDraft(data) {
  return draftModel.create(data);
}

// Fetches a single draft, throws 404 error if missing
async function getDraftById(id) {
  const draft = await draftModel.findById(id);
  if (!draft) {
    const err = new Error('Draft not found');
    err.status = 404;
    throw err;
  }
  return draft;
}

// Builds search filter and returns paginated drafts with meta
async function listDrafts({ page, limit, search }) {
  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    draftModel.findManyPaginated({ where, skip, take: limit }),
    draftModel.count(where),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

// Updates a draft only if the provided version matches current DB version
async function updateDraft(id, data, ifMatchVersion) {
  const existing = await getDraftById(id);

  if (ifMatchVersion === undefined) {
    const err = new Error('If-Match header is required');
    err.status = 428;
    throw err;
  }

  if (Number(ifMatchVersion) !== existing.version) {
    const err = new Error('Draft has been modified by another user.');
    err.status = 409;
    err.currentVersion = existing.version;
    throw err;
  }

  const { version, ...rest } = data;
  return draftModel.update(id, { ...rest, version: existing.version + 1 });
}

// Deletes a draft, throws 404 if it doesn't exist
async function deleteDraft(id) {
  await getDraftById(id);
  return draftModel.remove(id);
}

module.exports = { createDraft, getDraftById, listDrafts, updateDraft, deleteDraft };