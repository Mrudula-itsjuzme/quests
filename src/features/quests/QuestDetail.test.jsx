import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestDetail } from './QuestDetail';
const submit=vi.fn().mockResolvedValue({submission:{status:'manual_review'}});
vi.mock('./queries',()=>({usePostProgress:()=>({}),useSubmitProof:()=>({mutateAsync:submit})}));
vi.mock('../../lib/supabase',()=>({supabaseConfigured:false,uploadQuestProof:vi.fn()}));
it('requires explicit submission of a camera photo and does not opt into the feed',async()=>{
  const create=URL.createObjectURL,revoke=URL.revokeObjectURL;
  URL.createObjectURL=vi.fn(()=> 'blob:preview'); URL.revokeObjectURL=vi.fn();
  try {
    render(<QuestDetail initialPhoto={new File(['photo'],'quest.jpg',{type:'image/jpeg'})} quest={{id:'photo-quest',title:'Watch a bird',description:'Find a bird',status:'active',verificationType:'PHOTO',progressValue:0,targetValue:1,xpReward:20,instructions:[]}}/>);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Submit this photo'}));
    await waitFor(()=>expect(submit).toHaveBeenCalledWith({assignmentId:'photo-quest',payload:{uploadId:expect.stringMatching(/^local_/),feedOptIn:false}}));
  } finally { URL.createObjectURL=create; URL.revokeObjectURL=revoke; }
});
