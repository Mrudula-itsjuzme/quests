import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoveryCard } from './DiscoveryCard';
it('keeps identification edits, sharing and journal save wired independently',()=>{
  const onTitleChange=vi.fn(),onNotesChange=vi.fn(),onShare=vi.fn(),onAddToLibrary=vi.fn();
  render(<DiscoveryCard isNew card={{itemName:'Kingfisher',confidence:0.96}} notesValue="River walk" onTitleChange={onTitleChange} onNotesChange={onNotesChange} onShare={onShare} onAddToLibrary={onAddToLibrary}/>);
  expect(screen.getByText('96% match')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'View Details'}));
  fireEvent.change(screen.getByLabelText('Discovery name'),{target:{value:'Common Kingfisher'}});
  expect(onTitleChange).toHaveBeenCalledWith('Common Kingfisher');
  fireEvent.change(screen.getByLabelText('Notes'),{target:{value:'On a branch'}});
  expect(onNotesChange).toHaveBeenCalledWith('On a branch');
  fireEvent.click(screen.getByRole('button',{name:'Share discovery'}));
  expect(onShare).toHaveBeenCalledWith({caption:'River walk'});
  expect(onAddToLibrary).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Save to Journal'}));
  expect(onAddToLibrary).toHaveBeenCalledOnce();
});
