import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, categoryIcon } from '../../components/Icon';
import { useMe, useUpdateMe } from '../quests/queries';
import { playHover, playSuccess, playTap } from '../../lib/useSoundEffects';

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export function OnboardingPage() {
  const { data: me, isLoading } = useMe();
  const updateMe = useUpdateMe();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState(detectedTimezone);
  const [primaryPath, setPrimaryPath] = useState('Mind');

  if (isLoading) return <p role="status" className="fullscreen-status">Preparing your field journal…</p>;
  if (me?.onboardingCompletedAt) return <Navigate to="/app" replace />;

  const onNextStep = (e) => {
    e?.preventDefault();
    playTap();
    setStep((s) => Math.min(3, s + 1));
  };

  const onPrevStep = () => {
    playTap();
    setStep((s) => Math.max(1, s - 1));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    playSuccess();
    await updateMe.mutateAsync({
      displayName: displayName.trim() || undefined,
      timezone,
      primaryPath,
      onboardingCompleted: true,
    });
  };

  return (
    <main className="onboarding-shell celestial-onboarding">
      <section className="onboarding-experience">
        <aside className="onboarding-visual" aria-hidden="true">
          <img src="/auth-celestial-aperture.png" alt="" />
          <div className="onboarding-orbit">
            <Icon name={categoryIcon(primaryPath)} />
          </div>
          <p>Chapter {step} of 3 — Your path unfolds</p>
        </aside>

        <div className="onboarding-card">
          <div className="onboarding-chapter">
            <span>0{step}</span>
            <div>
              <small>CHAPTER {step === 1 ? 'ONE' : step === 2 ? 'TWO' : 'THREE'}</small>
              <strong>{step === 1 ? 'Wayfarer Identity' : step === 2 ? 'Primary Sanctuary Path' : 'Milestone Pledge'}</strong>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1>How shall the journal address you?</h1>
                <p>Choose an adventurer name for your daily progress logs and guild recognition.</p>
                <form onSubmit={onNextStep} className="onboarding-form">
                  <div className="auth-field">
                    <label htmlFor="displayName">Wayfarer Name</label>
                    <input
                      id="displayName"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      maxLength={120}
                      placeholder="e.g. Scholar Rowan, Wayfarer Lyra"
                      required
                    />
                  </div>
                  <button type="submit" className="auth-submit" onMouseEnter={playHover}>
                    <span>Continue to Path Focus</span>
                    <Icon name="compass" />
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1>Choose your primary path</h1>
                <p>This tunes your daily quest deck to focus on your core growth pillar.</p>
                <form onSubmit={onNextStep} className="onboarding-form">
                  <fieldset>
                    <legend className="sr-only">Primary focus</legend>
                    <div className="path-options">
                      {['Mind', 'Body', 'Discovery'].map((path) => (
                        <label
                          key={path}
                          className={`path-option ${primaryPath === path ? 'selected' : ''}`}
                          onClick={() => playTap()}
                          onMouseEnter={playHover}
                        >
                          <input
                            type="radio"
                            name="primaryPath"
                            value={path}
                            checked={primaryPath === path}
                            onChange={() => setPrimaryPath(path)}
                          />
                          <span className="path-option-icon"><Icon name={categoryIcon(path)} /></span>
                          <span>
                            <strong>{path === 'Mind' ? 'Nature Observation' : path === 'Body' ? 'Outdoor Movement' : path}</strong>
                            <small>{path === 'Mind' ? 'Wildlife & landscape study' : path === 'Body' ? 'Hiking & exploration' : 'Curiosity & observation'}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="step-nav-actions">
                    <button type="button" className="ghost-action" onClick={onPrevStep} onMouseEnter={playHover}>
                      ‹ Back
                    </button>
                    <button type="submit" className="auth-submit" onMouseEnter={playHover}>
                      <span>Set Timezone & Pledge</span>
                      <Icon name="compass" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1>Seal your adventure pledge</h1>
                <p>Daily quests reset at midnight in your local timezone to keep your streak true.</p>
                <form onSubmit={onSubmit} className="onboarding-form">
                  <div className="auth-field">
                    <label htmlFor="timezone">Timezone Sanctuary</label>
                    <input
                      id="timezone"
                      value={timezone}
                      onChange={(event) => setTimezone(event.target.value)}
                      maxLength={80}
                      required
                    />
                    <span className="field-hint">Auto-detected for your location; edit if traveling.</span>
                  </div>

                  {updateMe.isError && <p role="alert" className="form-error">Could not save your profile. Please try again.</p>}

                  <div className="step-nav-actions">
                    <button type="button" className="ghost-action" onClick={onPrevStep} onMouseEnter={playHover}>
                      ‹ Back
                    </button>
                    <button type="submit" className="auth-submit" disabled={updateMe.isPending} onMouseEnter={playHover}>
                      <span>{updateMe.isPending ? 'Sealing Journal…' : 'Begin Your Quest Journey'}</span>
                      <Icon name={updateMe.isPending ? 'star' : 'compass'} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
