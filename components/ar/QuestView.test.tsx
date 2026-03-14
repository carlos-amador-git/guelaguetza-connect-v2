import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '../../test/test-utils';
import { QuestView } from './QuestView';
import { QuestCard } from './QuestCard';
import { AchievementCard } from './AchievementCard';
import { ARProfileView } from './ARProfileView';
import { ViewState } from '../../types';
import type { Quest, UserQuestProgress, Achievement } from '../../types/ar';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockQuest: Quest = {
  id: 1,
  codigo: 'busqueda_donaji',
  nombre: 'La Busqueda de Donaji',
  descripcion: 'Encuentra los lirios de la princesa zapoteca',
  narrativa: 'Cuenta la leyenda que Donaji...',
  totalItems: 4,
  ordenRequerido: false,
  rewardPoints: 500,
  rewardDescription: '500 puntos de recompensa',
  active: true,
};

const mockQuestDetail = {
  ...mockQuest,
  items: [
    {
      id: 10,
      uuid: 'uuid-10',
      codigo: 'LIRIO-01',
      nombre: 'Lirio del Monte',
      tipo: 'quest_item' as const,
      lat: 17.06,
      lng: -96.72,
      activationRadiusMeters: 50,
      trackingType: 'ground' as const,
      isCollectible: true,
      pointsValue: 100,
      active: true,
      featured: false,
      narrativa: 'El primer lirio fue hallado...',
      regionNombre: 'Valles Centrales',
      regionColor: '#E63946',
    },
    {
      id: 11,
      uuid: 'uuid-11',
      codigo: 'LIRIO-02',
      nombre: 'Lirio del Rio',
      tipo: 'quest_item' as const,
      lat: 17.07,
      lng: -96.73,
      activationRadiusMeters: 50,
      trackingType: 'ground' as const,
      isCollectible: true,
      pointsValue: 100,
      active: true,
      featured: false,
    },
  ],
};

const mockProgress: UserQuestProgress = {
  id: 1,
  userId: 'test-user',
  questId: 1,
  itemsCollected: 1,
  startedAt: '2026-03-01T10:00:00Z',
  itemsFound: [10],
};

const mockAchievement: Achievement = {
  id: 1,
  codigo: 'first_collection',
  nombre: 'Primera coleccion',
  descripcion: 'Colecta tu primer punto AR',
  tipo: 'first_action',
  requisitos: { count: 1 },
  pointsReward: 50,
  dificultad: 'facil',
  active: true,
};

const noop = () => {};

// ============================================================================
// MOCK HOOKS
// ============================================================================

vi.mock('../../hooks/ar/useDeviceId', () => ({
  useDeviceId: () => 'mock-device-id',
}));

// ============================================================================
// TESTS: QuestView
// ============================================================================

describe('QuestView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders loading skeleton initially', () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockQuestDetail,
    } as Response);

    render(
      <QuestView questId="1" onNavigate={noop} onBack={noop} />
    );

    expect(document.querySelector('[data-testid="quest-view-loading"]')).toBeInTheDocument();
  });

  it('renders quest name after loading', async () => {
    vi.mocked(fetch).mockImplementation((url: RequestInfo | URL) => {
      const urlStr = String(url);
      if (urlStr.includes('/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProgress,
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockQuestDetail,
      } as Response);
    });

    render(
      <QuestView questId="1" onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('quest-view')).toBeInTheDocument();
    });

    expect(screen.getByText('La Busqueda de Donaji')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    } as Response);

    render(
      <QuestView questId="999" onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('quest-view-error')).toBeInTheDocument();
    });
  });

  it('shows progress bar with correct found count', async () => {
    vi.mocked(fetch).mockImplementation((url: RequestInfo | URL) => {
      const urlStr = String(url);
      if (urlStr.includes('/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockProgress, started: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockQuestDetail,
      } as Response);
    });

    render(
      <QuestView questId="1" onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('quest-view')).toBeInTheDocument();
    });

    // Progress section rendered
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders quest map section', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockQuestDetail,
    } as Response);

    render(
      <QuestView questId="1" onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('quest-map')).toBeInTheDocument();
    });
  });

  it('reveals narrative fragment when item is found', async () => {
    vi.mocked(fetch).mockImplementation((url: RequestInfo | URL) => {
      const urlStr = String(url);
      if (urlStr.includes('/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockProgress, started: true, itemsFound: [10] }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockQuestDetail,
      } as Response);
    });

    render(
      <QuestView questId="1" onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('narrative-fragment-0')).toBeInTheDocument();
    });

    expect(screen.getByText('El primer lirio fue hallado...')).toBeInTheDocument();
  });
});

// ============================================================================
// TESTS: QuestCard
// ============================================================================

describe('QuestCard', () => {
  it('renders quest name and description', () => {
    render(
      <QuestCard quest={mockQuest} onSelect={noop} />
    );

    expect(screen.getByText('La Busqueda de Donaji')).toBeInTheDocument();
    expect(screen.getByText('Encuentra los lirios de la princesa zapoteca')).toBeInTheDocument();
  });

  it('shows Iniciar button when not started', () => {
    render(
      <QuestCard quest={mockQuest} progress={null} onSelect={noop} />
    );

    expect(screen.getByText('Iniciar')).toBeInTheDocument();
  });

  it('shows Continuar when quest is started', () => {
    render(
      <QuestCard quest={mockQuest} progress={mockProgress} onSelect={noop} />
    );

    expect(screen.getByText('Continuar')).toBeInTheDocument();
  });

  it('shows Ver when quest is completed', () => {
    render(
      <QuestCard
        quest={mockQuest}
        progress={{ ...mockProgress, completedAt: '2026-03-02T15:00:00Z' }}
        onSelect={noop}
      />
    );

    expect(screen.getByText('Ver')).toBeInTheDocument();
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    render(
      <QuestCard quest={mockQuest} onSelect={onSelect} />
    );

    screen.getByRole('article').click();
    expect(onSelect).toHaveBeenCalledWith(mockQuest);
  });

  it('shows progress bar with correct percentage', () => {
    render(
      <QuestCard quest={mockQuest} progress={mockProgress} onSelect={noop} />
    );

    expect(screen.getByText('1 / 4 items')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});

// ============================================================================
// TESTS: AchievementCard
// ============================================================================

describe('AchievementCard', () => {
  it('renders achievement name when unlocked', () => {
    render(
      <AchievementCard achievement={mockAchievement} isUnlocked={true} />
    );

    expect(screen.getByText('Primera coleccion')).toBeInTheDocument();
  });

  it('shows ??? for name when locked', () => {
    render(
      <AchievementCard achievement={mockAchievement} isUnlocked={false} />
    );

    expect(screen.getByText('???')).toBeInTheDocument();
    expect(screen.queryByText('Primera coleccion')).not.toBeInTheDocument();
  });

  it('shows points reward', () => {
    render(
      <AchievementCard achievement={mockAchievement} isUnlocked={true} />
    );

    expect(screen.getByText('+50 pts')).toBeInTheDocument();
  });

  it('shows Bloqueado text when locked', () => {
    render(
      <AchievementCard achievement={mockAchievement} isUnlocked={false} />
    );

    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
  });

  it('shows formatted unlock date when provided', () => {
    render(
      <AchievementCard
        achievement={mockAchievement}
        isUnlocked={true}
        unlockedAt="2026-03-01T12:00:00Z"
      />
    );

    // Date should be formatted and visible
    const dateEl = screen.getByText(/\d+.*\d{4}/);
    expect(dateEl).toBeInTheDocument();
  });
});

// ============================================================================
// TESTS: ARProfileView
// ============================================================================

describe('ARProfileView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders loading skeleton initially', () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(
      <ARProfileView onNavigate={noop} onBack={noop} />
    );

    expect(screen.getByTestId('ar-profile-loading')).toBeInTheDocument();
  });

  it('renders profile view after loading', async () => {
    const mockProfile = {
      userId: 'mock-device-id',
      totalCollected: 5,
      totalAvailable: 20,
      percentageComplete: 25,
      totalPoints: 500,
      achievementsUnlocked: 3,
      ranking: 2,
      collectionByRegion: [],
      achievements: [],
      questProgress: [],
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    render(
      <ARProfileView onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ar-profile-view')).toBeInTheDocument();
    });
  });

  it('displays ranking when available', async () => {
    const mockProfile = {
      userId: 'mock-device-id',
      totalCollected: 5,
      totalAvailable: 20,
      percentageComplete: 25,
      totalPoints: 500,
      achievementsUnlocked: 3,
      ranking: 2,
      collectionByRegion: [],
      achievements: [],
      questProgress: [],
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    render(
      <ARProfileView onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByText('Rango #2')).toBeInTheDocument();
    });
  });

  it('shows stats: points, items, achievements', async () => {
    const mockProfile = {
      userId: 'mock-device-id',
      totalCollected: 7,
      totalAvailable: 20,
      percentageComplete: 35,
      totalPoints: 750,
      achievementsUnlocked: 4,
      ranking: 3,
      collectionByRegion: [],
      achievements: [],
      questProgress: [],
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    render(
      <ARProfileView onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ar-profile-view')).toBeInTheDocument();
    });

    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders region progress bars when collectionByRegion is provided', async () => {
    const mockProfile = {
      userId: 'mock-device-id',
      totalCollected: 5,
      totalAvailable: 20,
      percentageComplete: 25,
      totalPoints: 500,
      achievementsUnlocked: 1,
      ranking: null,
      collectionByRegion: [
        {
          regionId: 1,
          regionNombre: 'Valles Centrales',
          regionColor: '#E63946',
          collected: 3,
          total: 10,
        },
      ],
      achievements: [],
      questProgress: [],
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    render(
      <ARProfileView onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByText('Valles Centrales')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    render(
      <ARProfileView onNavigate={noop} onBack={noop} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ar-profile-error')).toBeInTheDocument();
    });
  });
});
