import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDrafts } from '../hooks/useDrafts';
import { useDeleteDraft } from '../hooks/useDraftMutations';
import DraftList from '../components/DraftList';
import DraftListSkeleton from '../components/DraftListSkeleton';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Notification from '../components/Notification';
import './DraftListPage.css';

const PAGE_LIMIT = 10;

function DraftListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useDrafts({ page, limit: PAGE_LIMIT, search });
  const deleteDraft = useDeleteDraft();

  function handleSearch(value) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="draft-list-page">
      <div className="draft-list-page__header">
        <h1>Collaborative Draft Manager</h1>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/drafts/new')}>
          + New Draft
        </button>
      </div>

      <SearchBar value={search} onSearch={handleSearch} />

      {isError && (
        <Notification type="error">
          {error?.response?.data?.message || 'Failed to load drafts.'}
        </Notification>
      )}

      {isLoading && <DraftListSkeleton />}

      {!isLoading && !isError && (
        <>
          <DraftList
            drafts={data?.data}
            onEdit={(id) => navigate(`/drafts/${id}`)}
            onDelete={(id) => deleteDraft.mutate(id)}
            onCreate={() => navigate('/drafts/new')}
          />
          <Pagination
            page={data?.meta?.page || page}
            totalPages={data?.meta?.totalPages || 0}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default DraftListPage;
