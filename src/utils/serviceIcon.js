import { Droplet, Palette, Sparkles, Paintbrush, Feather, Wand2, Trash2, Wrench } from 'lucide-react';

// Mapea un servicio a un ícono según palabras clave en su nombre.
// Si no matchea ninguna, usa un ícono genérico (Sparkles).
const RULES = [
  { keywords: ['gel'], icon: Droplet },
  { keywords: ['rubber'], icon: Palette },
  { keywords: ['acrílico natural', 'acrilico natural'], icon: Sparkles },
  { keywords: ['acrílico', 'acrilico'], icon: Paintbrush },
  { keywords: ['francés', 'frances', 'french'], icon: Feather },
  { keywords: ['nail art', 'diseño adicional', 'diseno adicional'], icon: Wand2 },
  { keywords: ['retiro'], icon: Trash2 },
  { keywords: ['reparaci'], icon: Wrench },
];

export const getServiceIcon = (name = '') => {
  const normalized = name.toLowerCase();
  const match = RULES.find(({ keywords }) => keywords.some((k) => normalized.includes(k)));
  return match ? match.icon : Sparkles;
};
