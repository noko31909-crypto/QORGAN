import { ReactNode } from 'react';
import { Colors } from '../theme';

type Props = {
  title: string;
  children: ReactNode;
};

export const ScreenShell = ({ title, children }: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: Colors.primary }}>
    <div style={{
      height: 64,
      padding: '0 18px',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <span style={{ color: Colors.accent, fontWeight: 800, fontSize: 24 }}>{title}</span>
    </div>
    <div style={{
      flex: 1,
      background: Colors.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {children}
    </div>
  </div>
);
