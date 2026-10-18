import { useState } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import './styles.css';
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

export type ViewId = 'home' | AvailableStructureId;

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('home');

  const selectStructure = (id: AvailableStructureId) => setActiveView(id);
  const goHome = () => setActiveView('home');

  if (activeView === 'home') {
    return (
      <>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <ThemeToggle />
        <LandingPage onSelect={selectStructure} />
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
        <StructureNav activeId={activeView} onSelect={selectStructure} onGoHome={goHome} />
        <LinkedListWorkspace active={activeView === 'linked-list'} />
        <StackWorkspace active={activeView === 'stack'} />
        <QueueWorkspace active={activeView === 'queue'} />
        <BstWorkspace active={activeView === 'bst'} />
        <PriorityQueueWorkspace active={activeView === 'priority-queue'} />
        <GraphWorkspace active={activeView === 'graph'} />
      </div>
    </>
  );
}
