import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

export type BarcodeConfig = {
  barcodeType: string;
  setBarcodeType: Dispatch<SetStateAction<string>>;
  payload: string;
  setPayload: Dispatch<SetStateAction<string>>;
  foreground: string;
  setForeground: Dispatch<SetStateAction<string>>;
  background: string;
  setBackground: Dispatch<SetStateAction<string>>;
  scale: number;
  setScale: Dispatch<SetStateAction<number>>;
  height: number;
  setHeight: Dispatch<SetStateAction<number>>;
  padding: number;
  setPadding: Dispatch<SetStateAction<number>>;
  errorLevel: string;
  setErrorLevel: Dispatch<SetStateAction<string>>;
  showText: boolean;
  setShowText: Dispatch<SetStateAction<boolean>>;
  logoSize: number;
  setLogoSize: Dispatch<SetStateAction<number>>;
  logoImage: HTMLImageElement | null;
  setLogoImage: Dispatch<SetStateAction<HTMLImageElement | null>>;
};

const BarcodeConfigContext = createContext<BarcodeConfig | null>(null);

export function BarcodeConfigProvider({ children }: { children: ReactNode }) {
  const [barcodeType, setBarcodeType] = useState('qrcode');
  const [payload, setPayload] = useState('https://npc-barcode.com');
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [scale, setScale] = useState(4);
  const [height, setHeight] = useState(50);
  const [padding, setPadding] = useState(10);
  const [errorLevel, setErrorLevel] = useState('M');
  const [showText, setShowText] = useState(true);
  const [logoSize, setLogoSize] = useState(20);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  return (
    <BarcodeConfigContext.Provider
      value={{
        barcodeType, setBarcodeType, payload, setPayload,
        foreground, setForeground, background, setBackground,
        scale, setScale, height, setHeight, padding, setPadding,
        errorLevel, setErrorLevel, showText, setShowText,
        logoSize, setLogoSize, logoImage, setLogoImage,
      }}
    >
      {children}
    </BarcodeConfigContext.Provider>
  );
}

export function useBarcodeConfig() {
  const context = useContext(BarcodeConfigContext);

  if (!context) {
    throw new Error('useBarcodeConfig must be used within BarcodeConfigProvider.');
  }

  return context;
}
