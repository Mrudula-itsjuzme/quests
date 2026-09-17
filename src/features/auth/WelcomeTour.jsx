import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const slides = [
  { title: <>Discover<br />Real Places</>, text: 'Explore breathtaking locations, encounter incredible wildlife and be part of a global community.', image: '/assets/reference-onboarding.png' },
  { title: <>Capture<br />the Wild</>, text: 'Meet the nature around you. Identify a discovery and keep its story in your own journal.', image: '/assets/guest-library/butterfly.jpg' },
  { title: <>Find Your<br />People</>, text: 'Share your discoveries, meet fellow explorers and make your next outing together.', image: '/assets/verdant-explorer-banner.png' },
];
export function WelcomeTour() {
  const [step, setStep] = useState(0);
  const slide = slides[step];
  return <main className="reference-tour">
    <img src={slide.image} alt="" className="reference-tour-photo" />
    <div className="reference-tour-shade" />
    <Link className="reference-tour-skip" to="/sign-in">Skip</Link>
    <section className="reference-tour-copy" aria-live="polite"><h1>{slide.title}</h1><p>{slide.text}</p></section>
    <footer className="reference-tour-footer">
      <div className="reference-tour-dots" aria-label="Introduction pages">{slides.map((_, index) => <button key={index} aria-label={`Introduction page ${index + 1}`} aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)}><span /></button>)}</div>
      {step < slides.length - 1 ? <button className="reference-tour-next" aria-label="Next introduction page" onClick={() => setStep(step + 1)}><ArrowRight /></button> : <Link className="reference-tour-next" aria-label="Continue to sign in" to="/sign-in"><ArrowRight /></Link>}
    </footer>
  </main>;
}
