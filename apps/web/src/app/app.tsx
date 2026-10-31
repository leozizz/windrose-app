import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityType,
  ActivityRankingResult,
  DailyScore,
  PointOfInterest,
} from '@windrose/shared-types';
import {
  Compass,
  Search,
  Globe,
  MapPin,
  Flame,
  Heart,
  Map,
  Sun,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../services/api.client';
import { useTripSession } from '../hooks/useTripSession';
import { SwipeDeck } from '../components/SwipeDeck';
import { MatchesList } from '../components/MatchesList';
import { ItineraryView } from '../components/ItineraryView';
import { ItineraryPlannerEngine } from '../services/itinerary-planner.engine';
import { formatActivity, formatRecommendation } from '../utils/labels';

type ActiveTab = 'swipe' | 'matches' | 'itinerary' | 'weather';

export function App() {
  const [cityNameInput, setCityNameInput] = useState<string>('');
  const [activeCity, setActiveCity] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(
    ActivityType.OUTDOOR_SIGHTSEEING
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('swipe');

  // Weather state
  const [ranking, setRanking] = useState<ActivityRankingResult | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Places Deck state
  const [places, setPlaces] = useState<PointOfInterest[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Trip Session Hook (Stateless Storage)
  const session = useTripSession(activeCity);

  const fetchData = useCallback(
    async (city: string, activity: ActivityType) => {
      const cleanCity = city.trim();
      if (!cleanCity) return;

      setLoadingWeather(true);
      setWeatherError(null);
      setLoadingPlaces(true);
      setPlacesError(null);

      try {
        const rankingResult = await apiClient.getRanking(cleanCity, activity);
        setRanking(rankingResult);

        const locationName = rankingResult.locationName || cleanCity;
        setActiveCity(locationName);

        // Safely extract coordinates (supports flat lat/lon or nested coordinates)
        const lat =
          rankingResult.latitude ??
          (rankingResult as unknown as { coordinates?: { latitude: number } }).coordinates?.latitude ??
          0;
        const lon =
          rankingResult.longitude ??
          (rankingResult as unknown as { coordinates?: { longitude: number } }).coordinates?.longitude ??
          0;

        // Fetch POIs using exact coordinates
        try {
          const deckResult = await apiClient.getPlacesDeck(locationName, lat, lon, 25);
          setPlaces(deckResult.deck || []);
        } catch (poiErr) {
          setPlacesError(
            poiErr instanceof Error
              ? poiErr.message
              : 'Não foi possível carregar os locais de interesse.'
          );
        }
      } catch (err) {
        setWeatherError(
          err instanceof Error
            ? err.message
            : 'Erro ao buscar dados meteorológicos da cidade.'
        );
      } finally {
        setLoadingWeather(false);
        setLoadingPlaces(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeCity) {
      fetchData(activeCity, selectedActivity);
    }
  }, [fetchData, activeCity, selectedActivity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityNameInput.trim()) {
      fetchData(cityNameInput.trim(), selectedActivity);
    }
  };

  // Safe reference to liked places
  const likedPlacesList = session.likedPois || [];

  // Safe daily scores list from backend
  const dailyScoresList: DailyScore[] = useMemo(() => {
    if (!ranking) return [];
    return (
      ranking.dailyScores ||
      (ranking as unknown as { dailyRanking?: DailyScore[] }).dailyRanking ||
      []
    );
  }, [ranking]);

  // Generate itinerary combining liked places with weather scores
  const generatedItinerary = useMemo(() => {
    if (!ranking || likedPlacesList.length === 0 || dailyScoresList.length === 0) return null;
    return ItineraryPlannerEngine.buildSmartItinerary(
      activeCity,
      likedPlacesList,
      dailyScoresList
    );
  }, [ranking, likedPlacesList, dailyScoresList, activeCity]);

  return (
    <div>
      {/* Modern Glassmorphic App Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-wrapper">
            <div className="brand-compass-icon" aria-hidden="true">
              <Compass size={22} color="#ffffff" strokeWidth={2.2} />
            </div>
            <div className="brand-info">
              <h1>Windrose</h1>
              <span className="brand-badge">Roteiros & Clima</span>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="header-search-form">
            <Search size={16} style={{ marginRight: '0.5rem', opacity: 0.6, flexShrink: 0 }} aria-hidden="true" />
            <input
              type="text"
              className="header-search-input"
              value={cityNameInput}
              onChange={(e) => setCityNameInput(e.target.value)}
              placeholder="Digite qualquer cidade (ex: Campinas, Tóquio, Roma)..."
              aria-label="Buscar cidade ou destino"
            />
            <button
              type="submit"
              className="header-search-btn"
              disabled={loadingWeather}
            >
              {loadingWeather ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={14} className="spin-animate" />
                  <span>Buscando...</span>
                </span>
              ) : (
                'Explorar'
              )}
            </button>
          </form>
        </div>
      </header>

      <main className="container">
        {/* Empty State / Welcome Screen when no city is searched yet */}
        {!activeCity && !loadingWeather && (
          <section className="welcome-hero-card" style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl, 28px)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-card)',
            padding: '4rem 2rem',
            textAlign: 'center',
            maxWidth: '680px',
            margin: '3rem auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--primary-subtle, #ffedd5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary, #ea580c)',
              }}>
                <Globe size={38} strokeWidth={1.8} />
              </div>
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Para onde você quer viajar?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Descubra os melhores pontos turísticos, restaurantes e passeios com base na previsão do tempo em tempo real.
              Dê matches nas atrações e gere seu roteiro inteligente!
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.5rem' }}>
                Sugestões populares:
              </span>
              {['Campinas', 'São Paulo', 'Rio de Janeiro', 'Curitiba', 'Salvador', 'Lisboa'].map((citySuggestion) => (
                <button
                  key={citySuggestion}
                  type="button"
                  className="action-button-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    setCityNameInput(citySuggestion);
                    fetchData(citySuggestion, selectedActivity);
                  }}
                >
                  <MapPin size={12} style={{ color: 'var(--primary)' }} />
                  <span>{citySuggestion}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Loading Weather state on initial search */}
        {loadingWeather && !ranking && (
          <div className="empty-deck-card">
            <div className="empty-deck-icon">
              <Loader2 size={40} className="spin-animate" style={{ color: 'var(--primary)' }} />
            </div>
            <h3>Analisando condições climáticas...</h3>
            <p>Conectando às estações meteorológicas e mapeando o destino.</p>
          </div>
        )}

        {/* City Loaded Content */}
        {activeCity && (
          <>
            {/* Navigation Tabs */}
            <div className="nav-tabs-wrapper">
              <nav className="nav-tabs" aria-label="Abas de navegação">
                <button
                  type="button"
                  className={`nav-tab-btn ${activeTab === 'swipe' ? 'active' : ''}`}
                  onClick={() => setActiveTab('swipe')}
                >
                  <Flame size={16} />
                  <span>Descoberta</span>
                </button>
                <button
                  type="button"
                  className={`nav-tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
                  onClick={() => setActiveTab('matches')}
                >
                  <Heart size={16} />
                  <span>Matches</span>
                  {likedPlacesList.length > 0 && (
                    <span className="nav-badge-count">{likedPlacesList.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`nav-tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('itinerary')}
                >
                  <Map size={16} />
                  <span>Roteiro</span>
                </button>
                <button
                  type="button"
                  className={`nav-tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
                  onClick={() => setActiveTab('weather')}
                >
                  <Sun size={16} />
                  <span>Previsão 7 Dias</span>
                </button>
              </nav>
            </div>

            {/* Hero Weather Banner */}
            {ranking && (
              <section className="weather-hero-banner" aria-label="Resumo do Destino">
                <div className="hero-location-info">
                  <h2>{ranking.locationName || activeCity}</h2>
                  <p>
                    Viabilidade para <strong>{formatActivity(ranking.activity)}</strong>:{' '}
                    <span className={`suitability-badge ${ranking.recommendationLevel || 'GOOD'}`}>
                      {formatRecommendation(ranking.recommendationLevel)} ({ranking.overallScore ?? 75}/100)
                    </span>
                  </p>
                </div>
                <div className="hero-weather-metrics">
                  <div className="metric-pill">
                    <span className="label">Classificação</span>
                    <span className="value">{formatRecommendation(ranking.recommendationLevel)}</span>
                  </div>
                  <div className="metric-pill">
                    <span className="label">Nota Geral</span>
                    <span className="value">{ranking.overallScore ?? 75}/100</span>
                  </div>
                  <div className="metric-pill">
                    <span className="label">Dias Analisados</span>
                    <span className="value">{dailyScoresList.length} dias</span>
                  </div>
                </div>
              </section>
            )}

            {/* Errors / Loading Alerts */}
            {weatherError && (
              <div className="empty-deck-card" style={{ borderColor: 'rgba(225, 29, 72, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#e11d48', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={20} />
                  <h3 style={{ margin: 0, color: '#e11d48' }}>Ocorreu um erro</h3>
                </div>
                <p>{weatherError}</p>
              </div>
            )}

            {/* Tab 1: Swipe Discovery */}
            {activeTab === 'swipe' && (
              <div>
                {loadingPlaces ? (
                  <div className="empty-deck-card">
                    <div className="empty-deck-icon">
                      <Loader2 size={40} className="spin-animate" style={{ color: 'var(--primary)' }} />
                    </div>
                    <h3>Buscando atrações reais em {activeCity}...</h3>
                    <p>Consultando dados georreferenciados e atrações locais.</p>
                  </div>
                ) : placesError ? (
                  <div className="empty-deck-card">
                    <h3>Aviso</h3>
                    <p>{placesError}</p>
                  </div>
                ) : (
                  <SwipeDeck
                    places={places}
                    isSwiped={session.isSwiped}
                    onSwipe={(poi, action) => {
                      if (action === 'liked') session.likePlace(poi);
                      else session.rejectPlace(poi);
                    }}
                    onUndo={session.undoLastAction}
                    canUndo={session.canUndo}
                    onViewMatches={() => setActiveTab('matches')}
                    totalLikes={likedPlacesList.length}
                  />
                )}
              </div>
            )}

            {/* Tab 2: Matches View */}
            {activeTab === 'matches' && (
              <MatchesList
                city={activeCity}
                matches={likedPlacesList}
                onBackToSwipe={() => setActiveTab('swipe')}
                onClearMatches={session.clearCitySession}
                onGenerateItinerary={() => setActiveTab('itinerary')}
              />
            )}

            {/* Tab 3: Itinerary View */}
            {activeTab === 'itinerary' && (
              <div>
                {generatedItinerary ? (
                  <ItineraryView
                    itinerary={generatedItinerary}
                    onBackToSwipe={() => setActiveTab('swipe')}
                  />
                ) : (
                  <div className="empty-deck-card">
                    <div className="empty-deck-icon">
                      <Sparkles size={40} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h3>Dê Match nos seus pontos favoritos</h3>
                    <p>
                      Para gerar seu roteiro de viagem otimizado para o clima de {activeCity},
                      visite a aba <strong>Descoberta</strong> e dê match em pelo menos um local!
                    </p>
                    <button
                      type="button"
                      className="action-button-primary"
                      onClick={() => setActiveTab('swipe')}
                    >
                      Ir para Descoberta →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: 7-Day Weather Forecast */}
            {activeTab === 'weather' && ranking && (
              <div className="matches-grid">
                {dailyScoresList.map((day) => (
                  <div key={day.date} className="match-card" style={{ padding: '1.5rem' }}>
                    <span className={`suitability-badge ${day.recommendationLevel}`} style={{ alignSelf: 'flex-start', marginBottom: '0.75rem' }}>
                      {formatRecommendation(day.recommendationLevel)} • {day.score}/100
                    </span>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                      {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </h3>
                    {day.reasons && day.reasons.length > 0 && (
                      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {day.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
export default App;
