import type { SampleBoard } from '../types';

export const SAMPLE_BOARDS: SampleBoard[] = [
  {
    id: 'pcb-qfp-01',
    title: 'QFP-64 Fine Pitch IC Joint Array',
    description: 'High-density micro-controller pins with suspected solder bridging and lead lifting.',
    type: 'SMT IC Package',
    defectCount: 2,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
    knownDefects: [
      {
        id: 'def-1',
        type: 'Solder Bridge',
        severity: 'CRITICAL',
        ipcStandard: 'IPC-A-610G 8.3.5.7',
        description: 'Metallic solder spanning between Pins 23 and 24 creating an electrical dead short.',
        location: { x: 38, y: 46, width: 14, height: 18 },
        reworkRecommendation: 'Apply liquid flux and draw away excess solder with braided de-soldering wick at 350°C.',
        confidence: 0.96
      },
      {
        id: 'def-2',
        type: 'Cold Joint',
        severity: 'WARNING',
        ipcStandard: 'IPC-A-610G 5.2.8',
        description: 'Dull, granular, non-wetted solder surface with micro-fissuring at Pin 28 heel fillet.',
        location: { x: 62, y: 52, width: 12, height: 16 },
        reworkRecommendation: 'Reflow joint with active rosin-core solder and ensure proper pre-heat dwell time.',
        confidence: 0.91
      }
    ]
  },
  {
    id: 'pcb-smd-02',
    title: '0402 Passive Resistor & Capacitor Bank',
    description: 'Ultra-small chip components exhibiting uneven reflow surface tension and component lift.',
    type: 'Discrete SMT Passives',
    defectCount: 1,
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1000&q=80',
    knownDefects: [
      {
        id: 'def-3',
        type: 'Tombstoning',
        severity: 'CRITICAL',
        ipcStandard: 'IPC-A-610G 8.3.2.9.2',
        description: 'C14 capacitor completely stood upright during vapor phase reflow due to thermal imbalance.',
        location: { x: 48, y: 35, width: 16, height: 22 },
        reworkRecommendation: 'Manually remove component with hot air pencil, re-tin pads evenly, and place replacement 0402.',
        confidence: 0.98
      }
    ]
  },
  {
    id: 'pcb-pwr-03',
    title: 'SOIC-8 MOSFET Switching Stage',
    description: 'High-current power conversion module inspected for solder voiding and insufficient fillets.',
    type: 'Power Management Circuit',
    defectCount: 1,
    imageUrl: 'https://images.unsplash.com/photo-1608564697071-ddf911d81370?auto=format&fit=crop&w=1000&q=80',
    knownDefects: [
      {
        id: 'def-4',
        type: 'Insufficient Solder',
        severity: 'WARNING',
        ipcStandard: 'IPC-A-610G 8.3.5.5',
        description: 'Heel fillet height is below 25% of lead thickness on Drain pad 3.',
        location: { x: 55, y: 60, width: 15, height: 16 },
        reworkRecommendation: 'Add small quantity of SN100C solder alloy to achieve minimum 50% wetting fillet.',
        confidence: 0.89
      }
    ]
  }
];
