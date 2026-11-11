import { useEffect, useState } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import './styles.css';
import { ComplexityPage } from './components/ComplexityPage';
import { LandingPage } from './components/LandingPage';
import { StructureNav } from './components/StructureNav';
import { BstWorkspace } from './workspaces/BstWorkspace';
import { GraphWorkspace } from './workspaces/GraphWorkspace';
import { LinkedListWorkspace } from './workspaces/LinkedListWorkspace';
import { PriorityQueueWorkspace } from './workspaces/PriorityQueueWorkspace';
import { QueueWorkspace } from './workspaces/QueueWorkspace';
import { StackWorkspace } from './workspaces/StackWorkspace';

export type AvailableStructureId =
  'linked-list' | 'stack' | 'queue' | 'bst' | 'priority-queue' | 'graph';

/** Views reachable from the sidebar: the six workspaces and the complexity reference. */
export type ShellViewId = AvailableStructureId | 'complexities';

export type ViewId = 'home' | ShellViewId;

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('home');

  // Each view starts at its top; otherwise a link low on the landing page or a long
  // complexity table would open the next view part-way down.
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeView]);

  const selectStructure = (id: AvailableStructureId) => setActiveView(id);
  const goHome = () => setActiveView('home');
  const openComplexities = () => setActiveView('complexities');

  if (activeView === 'home') {
    return (
      <>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <ThemeToggle />
        <LandingPage onSelect={selectStructure} onOpenComplexities={openComplexities} />
      </>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to visualizer
      </a>
      <ThemeToggle />
      <div className="app-shell">
        <StructureNav
          activeId={activeView}
          onSelect={selectStructure}
          onOpenComplexities={openComplexities}
          onGoHome={goHome}
        />
        <LinkedListWorkspace active={activeView === 'linked-list'} />
        <StackWorkspace active={activeView === 'stack'} />
        <QueueWorkspace active={activeView === 'queue'} />
        <BstWorkspace active={activeView === 'bst'} />
        <PriorityQueueWorkspace active={activeView === 'priority-queue'} />
        <GraphWorkspace active={activeView === 'graph'} />
        <ComplexityPage active={activeView === 'complexities'} onOpenStructure={selectStructure} />
      </div>
    </>
  );
}
