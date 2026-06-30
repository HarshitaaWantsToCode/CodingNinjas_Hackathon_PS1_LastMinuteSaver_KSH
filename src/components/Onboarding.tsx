import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: (userProfile: {
    username: string;
    email: string;
    age: number;
    role: string;
    commonTasks: string[];
    procrastinationReasons: string[];
    dailyHours: number;
  }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Credentials
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Profile questionnaire
  const [age, setAge] = useState<number>(20);
  const [role, setRole] = useState('Student');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [dailyHours, setDailyHours] = useState<number>(3);

  const roles = ["Student", "Software Engineer", "Researcher", "Designer", "Marketer", "Other"];

  const commonTasks = [
    "Syllabus & Lecture studies",
    "Code Sprints & Feature building",
    "Writing research papers",
    "Client feedback loops",
    "System Design & Refactoring"
  ];

  const procrastinationReasons = [
    "Perfectionism (afraid to make mistakes)",
    "Vague instructions (confused where to start)",
    "Low energy & mental fatigue",
    "Environmental distractions",
    "Oversleeping & poor scheduling"
  ];

  const toggleTask = (task: string) => {
    setSelectedTasks(prev =>
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (isLoggingIn) {
        handleLoginSubmit();
        return;
      }
      if (!username.trim() || !email.trim() || !password.trim()) {
        alert("Please enter all credentials to create your account.");
        return;
      }
    }
    if (step < 5) {
      setStep(prev => prev + 1);
    } else {
      // Save profile to local storage so they can log back in later
      const profile = {
        username: username.trim(),
        email: email.trim(),
        age,
        role,
        commonTasks: selectedTasks,
        procrastinationReasons: selectedReasons,
        dailyHours
      };
      localStorage.setItem(`oh_no_user_profile_${username.trim()}`, JSON.stringify(profile));
      onComplete(profile);
    }
  };

  const handleLoginSubmit = () => {
    if (!username.trim() || !password.trim()) {
      alert("Please enter both username and password.");
      return;
    }
    const savedProfile = localStorage.getItem(`oh_no_user_profile_${username.trim()}`);
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        onComplete(parsed);
      } catch (e) {
        alert("Session profile corrupted. Please sign up instead.");
      }
    } else {
      // Fallback: auto-create if not found to prevent login blockages during demo
      const fallbackProfile = {
        username: username.trim(),
        email: `${username.trim()}@domain.com`,
        age: 20,
        role: "Student",
        commonTasks: ["Syllabus & Lecture studies"],
        procrastinationReasons: ["Environmental distractions"],
        dailyHours: 3
      };
      localStorage.setItem(`oh_no_user_profile_${username.trim()}`, JSON.stringify(fallbackProfile));
      onComplete(fallbackProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12 animate-page-slide font-sans">
      <div className="w-full max-w-md bg-card-app border border-border-app rounded-2xl p-8 space-y-6">
        
        {/* Step Indicator */}
        <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary">
          <span>OHNO INITIALIZATION</span>
          <span>{isLoggingIn ? "LOG IN" : `STEP ${step} / 5`}</span>
        </div>

        {/* Step 1: Account setup or Login */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                {isLoggingIn ? "Log back into OhNo" : "Create your recovery account"}
              </h2>
              <p className="text-xs text-text-secondary">
                {isLoggingIn ? "Enter your credentials to load your workspace." : "Initialize your localized database session parameters."}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-text-secondary">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. harshitaa"
                  className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none font-mono"
                />
              </div>

              {!isLoggingIn && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-text-secondary">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-text-secondary">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none font-mono"
                />
              </div>

              {!isLoggingIn && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-text-secondary">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 20)}
                    className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none font-mono"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 space-y-4">
              <button
                onClick={handleNext}
                className="w-full bg-accent-app text-black py-3 rounded-xl font-mono font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
              >
                {isLoggingIn ? "Log In" : "Proceed to Profile"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLoggingIn(!isLoggingIn)}
                  className="text-xs text-text-secondary hover:text-text-primary font-mono"
                >
                  {isLoggingIn ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Role selection */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">Identify your workload role</h2>
              <p className="text-xs text-text-secondary">Select the perspective you work or study from.</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {roles.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setRole(r)}
                  className={`px-3.5 py-3 text-xs font-mono border rounded-xl text-left transition-all cursor-pointer ${
                    role === r
                      ? 'bg-text-primary text-bg-app border-none font-bold'
                      : 'bg-bg-app border-border-app text-text-primary hover:border-text-primary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={handleBack} className="px-4 py-2 text-xs font-mono text-text-secondary hover:text-text-primary cursor-pointer">Back</button>
              <button onClick={handleNext} className="px-5 py-2.5 text-xs font-mono font-bold bg-[#D9FF57] text-black rounded-lg cursor-pointer">Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Common tasks */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">What are your typical tasks?</h2>
              <p className="text-xs text-text-secondary">Select the actions you schedule most frequently.</p>
            </div>

            <div className="space-y-2">
              {commonTasks.map((task, i) => (
                <button
                  key={i}
                  onClick={() => toggleTask(task)}
                  className={`w-full text-left px-4 py-3.5 text-xs font-mono border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    selectedTasks.includes(task)
                      ? 'bg-text-primary/10 border-text-primary text-text-primary font-bold'
                      : 'bg-bg-app border-border-app text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{task}</span>
                  <span className="font-mono text-[9px]">
                    {selectedTasks.includes(task) ? "[x]" : "[ ]"}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={handleBack} className="px-4 py-2 text-xs font-mono text-[#9FA3A9] hover:text-[#F5F5F5] cursor-pointer">Back</button>
              <button onClick={handleNext} className="px-5 py-2.5 text-xs font-mono font-bold bg-[#D9FF57] text-black rounded-lg cursor-pointer">Next</button>
            </div>
          </div>
        )}

        {/* Step 4: Procrastination triggers */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">What causes deadline slippage?</h2>
              <p className="text-xs text-text-secondary">Identify your common roadblocks to build prediction offsets.</p>
            </div>

            <div className="space-y-2">
              {procrastinationReasons.map((reason, i) => (
                <button
                  key={i}
                  onClick={() => toggleReason(reason)}
                  className={`w-full text-left px-4 py-3.5 text-xs font-mono border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    selectedReasons.includes(reason)
                      ? 'bg-text-primary/10 border-text-primary text-text-primary font-bold'
                      : 'bg-bg-app border-border-app text-text-secondary hover:text-[#F5F5F5]'
                  }`}
                >
                  <span className="pr-2">{reason}</span>
                  <span className="font-mono text-[9px] shrink-0">
                    {selectedReasons.includes(reason) ? "[x]" : "[ ]"}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={handleBack} className="px-4 py-2 text-xs font-mono text-[#9FA3A9] hover:text-[#F5F5F5] cursor-pointer">Back</button>
              <button onClick={handleNext} className="px-5 py-2.5 text-xs font-mono font-bold bg-[#D9FF57] text-black rounded-lg cursor-pointer">Next</button>
            </div>
          </div>
        )}

        {/* Step 5: commitment slider */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">Survive daily bandwidth</h2>
              <p className="text-xs text-text-secondary">Select your realistic study/work availability per day.</p>
            </div>

            <div className="space-y-4 py-4">
              <input
                type="range"
                min="1"
                max="12"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseInt(e.target.value))}
                className="w-full accent-accent-app cursor-pointer"
              />
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-xs text-text-secondary">Bandwidth:</span>
                <span className="text-xl font-bold text-text-primary">{dailyHours} hours/day</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={handleBack} className="px-4 py-2 text-xs font-mono text-[#9FA3A9] hover:text-[#F5F5F5] cursor-pointer">Back</button>
              <button onClick={handleNext} className="px-5 py-2.5 text-xs font-mono font-bold bg-[#D9FF57] text-black rounded-lg cursor-pointer">
                Complete Setup
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
