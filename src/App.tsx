import { SceneProvider } from './hooks/useScene';
import { Layout } from './components/Layout';

function App() {
  return (
    <SceneProvider>
      <Layout />
    </SceneProvider>
  );
}

export default App;
