import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CaptureFlow } from './CaptureFlow';
const capture = vi.fn();
const navigate = vi.fn();
vi.mock('react-router-dom',async importOriginal=>({...await importOriginal(),useNavigate:()=>navigate}));
vi.mock('../quests/queries',()=>({
  useCaptureItem:()=>({mutateAsync:capture}),useAddCardToLibrary:()=>({}),useRenameCapture:()=>({}),useShareDiscovery:()=>({}),useMe:()=>({data:{id:'guest-one'}}),useSpecies:()=>({data:[]}),
}));
vi.mock('../../lib/useCameraPreview',()=>({useCameraPreview:()=>({videoRef:{current:null},status:'unavailable'})}));
vi.mock('../../lib/captureTelemetry',()=>({collectCaptureTelemetry:async()=>({capturedAt:'2026-09-15T10:00:00Z'})}));
vi.mock('../../lib/useSoundEffects',()=>({playTap:()=>{}}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>false}}));
vi.mock('@capacitor/camera',()=>({Camera:{},CameraResultType:{},CameraSource:{}}));
it('previews a photo and allows retaking without submitting it',async()=>{
  const {container}=render(<MemoryRouter><CaptureFlow onClose={()=>{}}/></MemoryRouter>);
  const input=document.querySelector('input[type="file"]');
  fireEvent.change(input,{target:{files:[new File(['photo'],'nature.jpg',{type:'image/jpeg'})]}});
  expect(await screen.findByAltText('Your photo preview')).toBeInTheDocument();
  expect(capture).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'For a Quest'}));
  expect(screen.getByRole('button',{name:'Choose a quest'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Retake'}));
  expect(await screen.findByRole('button',{name:'Take photo'})).toBeInTheDocument();
  expect(capture).not.toHaveBeenCalled();
  expect(container).toBeInTheDocument();
});

it('hands the original photo to Quests without identifying or posting it',async()=>{
  const previousFetch=global.fetch;
  global.fetch=vi.fn().mockResolvedValue({blob:async()=>new Blob(['photo'],{type:'image/jpeg'})});
  const onClose=vi.fn();
  try {
    render(<MemoryRouter><CaptureFlow onClose={onClose}/></MemoryRouter>);
    fireEvent.change(document.querySelector('input[type="file"]'),{target:{files:[new File(['photo'],'nature.jpg',{type:'image/jpeg'})]}});
    await screen.findByAltText('Your photo preview');
    fireEvent.click(screen.getByRole('button',{name:'For a Quest'}));
    fireEvent.click(screen.getByRole('button',{name:'Choose a quest'}));
    await waitFor(()=>expect(navigate).toHaveBeenCalledWith('/app/quests',{state:{questPhoto:expect.any(File)}}));
    expect(capture).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  } finally { global.fetch=previousFetch; }
});
