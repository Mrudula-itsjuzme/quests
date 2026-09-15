import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsModal } from './SettingsModal';
const requestAccountDeletion = vi.fn();
vi.mock('../lib/useApiClient', () => ({ useApiClient: () => ({ requestAccountDeletion }) }));
it('opens preferences from the reference menu and preserves theme actions', () => {
  const onThemeChange = vi.fn();
  render(<MemoryRouter><SettingsModal user={{id:'guest-one'}} onClose={()=>{}} onThemeChange={onThemeChange}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'App Preferences'}));
  fireEvent.click(screen.getByRole('button',{name:'Night'}));
  expect(onThemeChange).toHaveBeenCalledWith('dark');
});
it('does not submit deletion when the menu item is opened', () => {
  render(<MemoryRouter><SettingsModal user={{id:'account-one'}} onClose={()=>{}}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'Delete Account'}));
  expect(screen.getByRole('button',{name:'Confirm deletion request'})).toBeInTheDocument();
  expect(requestAccountDeletion).not.toHaveBeenCalled();
});
