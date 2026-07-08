const prisma = require('../../config/db');

// Fetches a single draft by id
function findById(id) {
  return prisma.draft.findUnique({ where: { id } });
}

// Fetches paginated/filtered drafts sorted by updatedAt DESC
function findManyPaginated({ where, skip, take }) {
  return prisma.draft.findMany({
    where,
    skip,
    take,
    orderBy: { updatedAt: 'desc' },
  });
}

// Counts drafts matching a filter
function count(where) {
  return prisma.draft.count({ where });
}

// Inserts a new draft record
function create(data) {
  return prisma.draft.create({ data });
}

// Updates an existing draft record by id
function update(id, data) {
  return prisma.draft.update({ where: { id }, data });
}

// Deletes a draft record by id
function remove(id) {
  return prisma.draft.delete({ where: { id } });
}

module.exports = { findById, findManyPaginated, count, create, update, remove };