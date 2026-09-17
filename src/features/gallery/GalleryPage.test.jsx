import { render, screen, fireEvent } from '@testing-library/react';
import { GalleryPage } from './GalleryPage';
const state = vi.hoisted(() => ({ failed: false, refetch: vi.fn() }));
vi.mock('../quests/queries', () => ({
  useCaptures: () => ({ isError: state.failed, refetch: state.refetch, data: state.failed ? undefined : [
    { id: 'plant', itemName: 'Fern', category: 'Flora', capturedAt: '2026-09-16', status: 'final' },
    { id: 'bird', itemName: 'Kingfisher', category: 'Fauna', capturedAt: '2026-09-16', status: 'final' },
  ] }),
  useSpecies: () => ({ data: [] }),
}));
vi.mock('./useJournalPreferences', () => ({ useJournalPreferences: () => ({ favorites: [], toggleFavorite: vi.fn(), markViewed: vi.fn() }) }));
vi.mock('../../components/CaptureImage', () => ({ CaptureImage: ({ alt }) => <img alt={alt} /> }));
vi.mock('./SpeciesDetail', () => ({ SpeciesDetail: () => null }));
it('makes plant captures discoverable through the Plants filter', () => {
  render(<GalleryPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Plants', exact: true }));
  expect(screen.getByAltText('Fern')).toBeInTheDocument();
  expect(screen.queryByAltText('Kingfisher')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Wildlife', exact: true }));
  expect(screen.getByAltText('Kingfisher')).toBeInTheDocument();
  expect(screen.queryByAltText('Fern')).not.toBeInTheDocument();
});


it('shows a retry instead of an empty journal when loading fails', () => {
  state.failed = true;
  try {
    render(<GalleryPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('have not been deleted');
    expect(screen.queryByText('Start your Journal.')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Library summary' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(state.refetch).toHaveBeenCalledOnce();
  } finally { state.failed = false; }
});
