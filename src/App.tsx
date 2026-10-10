import { useState } from 'react';
import './styles.css';
import { StructureNav } from './components/StructureNav';
import { LinkedListWorkspace } from './workspaces/LinkedListWorkspace';
import { PriorityQueueWorkspace } from './workspaces/PriorityQueueWorkspace';
import { QueueWorkspace } from './workspaces/QueueWorkspace';
import { StackWorkspace } from './workspaces/StackWorkspace';

export type AvailableStructureId = 'linked-list' | 'stack' | 'queue' | 'priority-queue';

export default function App() {
  const [activeStructure, setActiveStructure] = useState<AvailableStructureId>('linked-list');

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to visualizer
      </a>
      <div className="app-shell">
        <StructureNav activeId={activeStructure} onSelect={setActiveStructure} />
        <LinkedListWorkspace active={activeStructure === 'linked-list'} />
        <StackWorkspace active={activeStructure === 'stack'} />
        <QueueWorkspace active={activeStructure === 'queue'} />
        <PriorityQueueWorkspace active={activeStructure === 'priority-queue'} />
      </div>
    </>
  );
}
