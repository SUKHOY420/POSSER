import { usePOS, POSProvider } from './store';
import ScreenSelect from './components/ScreenSelect';
import MainScreen from './components/MainScreen';
import KitchenScreen from './components/KitchenScreen';
import ServerScreen from './components/ServerScreen';
import CloseSession from './components/CloseSession';

function AppContent() {
  const { state } = usePOS();

  switch (state.screen) {
    case 'select':
      return <ScreenSelect />;
    case 'main':
      return <MainScreen />;
    case 'kitchen':
      return <KitchenScreen />;
    case 'server':
      return <ServerScreen />;
    case 'close':
      return <CloseSession />;
    default:
      return <ScreenSelect />;
  }
}

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}
