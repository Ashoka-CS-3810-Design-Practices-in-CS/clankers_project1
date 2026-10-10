import { useState } from 'react';
import './styles.css';
import { StructureNav } from './components/StructureNav';
import { BstWorkspace } from './workspaces/BstWorkspace';
import { LinkedListWorkspace } from './workspaces/LinkedListWorkspace';
import { PriorityQueueWorkspace } from './workspaces/PriorityQueueWorkspace';
import { QueueWorkspace } from './workspaces/QueueWorkspace';
import { StackWorkspace } from './workspaces/StackWorkspace';

<<<<<<< HEAD
export type AvailableStructureId = 'linked-list' | 'stack' | 'queue' | 'priority-queue';
=======
export type AvailableStructureId = 'linked-list' | 'stack' | 'queue' | 'bst';
>>>>>>> 571a3dfd33994ec5a8d56bcb5a9477518ef0c8b4

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
<<<<<<< HEAD
        <PriorityQueueWorkspace active={activeStructure === 'priority-queue'} />
=======
        <BstWorkspace active={activeStructure === 'bst'} />
>>>>>>> 571a3dfd33994ec5a8d56bcb5a9477518ef0c8b4
      </div>
    </>
  );
}
