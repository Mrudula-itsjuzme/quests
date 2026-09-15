import { render, screen, fireEvent } from '@testing-library/react';
import { SpeciesDetail } from './SpeciesDetail';
vi.mock('../../components/CaptureImage',()=>({CaptureImage:({alt})=><img alt={alt}/>}));
const card={id:'one',itemName:'Kingfisher',speciesId:'bird',rarityStars:2,location:'River bank'};
it('shows actual sightings and opens related captures',()=>{
  const onSelect=vi.fn();
  render(<SpeciesDetail card={card} species={[{id:'bird',category:'Fauna'}]} collection={[card,{...card,id:'two'}]} onSelect={onSelect}/>);
  fireEvent.click(screen.getByRole('tab',{name:'Sightings'}));
  expect(screen.getAllByText('River bank')).toHaveLength(2);
  fireEvent.click(screen.getByRole('tab',{name:'Gallery'}));
  fireEvent.click(screen.getAllByRole('button',{name:'View Kingfisher'})[1]);
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({id:'two'}));
});
it('keeps bookmark and close actions separate',()=>{
  const onFavorite=vi.fn(),onClose=vi.fn();
  render(<SpeciesDetail card={card} favorite onFavorite={onFavorite} onClose={onClose}/>);
  fireEvent.click(screen.getByRole('button',{name:'Remove from favourites'}));
  expect(onFavorite).toHaveBeenCalledOnce();
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Back to Journal'}));
  expect(onClose).toHaveBeenCalledOnce();
});
