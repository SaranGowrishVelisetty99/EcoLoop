import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'stream/web';

// Set up globals FIRST before any other imports
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;

// Polyfill Web APIs for environments where they are missing (Node < 18)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const undici = require('undici');
global.fetch = undici.fetch;
global.Request = undici.Request;
global.Response = undici.Response;
global.Headers = undici.Headers;

class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
  takeRecords = jest.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => callback(null)),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  getIdToken: jest.fn(() => Promise.resolve('mock-token')),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(),
  })),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('lucide-react', () => {
  const icons = ['Leaf', 'Recycle', 'Sparkles', 'TimerReset', 'FolderOpen', 'CheckCircle', 'Award', 'Trash2', 'Trophy', 'User', 'Mail', 'Save', 'Loader2', 'ChevronLeft', 'AlertCircle', 'CheckCircle', 'Eye', 'EyeOff', 'ShieldCheck'];
  const mockIcon = ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span data-testid="icon" {...props}>{children}</span>;
  return icons.reduce((acc, name) => {
    acc[name] = mockIcon;
    return acc;
  }, {} as Record<string, React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>>);
});