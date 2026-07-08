import { Routes, Route } from 'react-router-dom';
import DraftListPage from '../features/drafts/pages/DraftListPage';
import DraftEditorPage from '../features/drafts/pages/DraftEditorPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DraftListPage />} />
      <Route path="/drafts/new" element={<DraftEditorPage />} />
      <Route path="/drafts/:id" element={<DraftEditorPage />} />
    </Routes>
  );
}

export default AppRoutes;