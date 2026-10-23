import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityType,
  ActivityRankingResult,
  PointOfInterest,
} from '@windrose/shared-types';
import { apiClient } from '../services/api.client';
import { useTripSession } from '../hooks/useTripSession';
import { SwipeDeck } from '../components/SwipeDeck';
import { MatchesList } from '../components/MatchesList';
import { ItineraryView } from '../components/ItineraryView';
import { ItineraryPlannerEngine } from '../services/itinerary-planner.engine';

type ActiveTab = 'swipe' | 'matches' | 'itinerary' | 'weather';

export function App() {
  const [cityNameInput, setCityNameInput] = useState<string>('Florianópolis');
  const [activeCity, setActiveCity] = useState<string>('Florianópolis');
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
      setLoadingWeather(true);
      setWeatherError(null);
      setLoadingPlaces(true);
      setPlacesError(null);

      try {
        const rankingResult = await apiClient.getRanking(city, activity);
        setRanking(rankingResult);
        setActiveCity(rankingResult.locationName);

        // Fetch POIs using exact coordinates
        try {
          const deckResult = await apiClient.getPlacesDeck(
            rankingResult.locationName,
            rankingResult.coordinates.latitude,
            rankingResult.coordinates.longitude,
            25
          );
          setPlaces(deckResult.deck);
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
    fetchData(activeCity, selectedActivity);
  }, [fetchData, activeCity, selectedActivity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityNameInput.trim()) {
      fetchData(cityNameInput.trim(), selectedActivity);
    }
  };

  // Generate itinerary automatically when visiting itinerary tab or requesting
  const generatedItinerary = useMemo(() => {
    if (!ranking || session.likedPlaces.length === 0) return null;
    return ItineraryPlannerEngine.generateItinerary({
      city: activeCity,
      activity: selectedActivity,
      likedPois: session.likedPlaces,
      dailyForecasts: ranking.dailyRanking,
    });
  }, [ranking, session.likedPlaces, activeCity, selectedActivity]);

  const topForecast = ranking?.dailyRanking[0];

  return (
    <div>
      {/* Modern Glassmorphic App Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-wrapper">
            <div className="brand-compass-icon">🧭</div>
            <div className="brand-info">
              <h1>Windrose</h1>
              <span className="brand-badge">Wanderlust 2.0</span>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="header-search-form">
            <span style={{ marginRight: '0.5rem', opacity: 0.6 }}>🔍</span>
            <input
              type="text"
              className="header-search-input"
              value={cityNameInput}
              onChange={(e) => setCityNameInput(e.target.value)}
              placeholder="Buscar destino (ex: Florianópolis, Curitiba, Paris)..."
            />
            <button
              type="submit"
              className="header-search-btn"
              disabled={loadingWeather}
            >
              {loadingWeather ? 'Buscando...' : 'Explorar'}
            </button>
          </form>
        </div>
      </header>

      <main className="container">
        {/* Navigation Tabs */}
        <div className="nav-tabs-wrapper">
          <nav className="nav-tabs" aria-label="Abas de navegação">
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'swipe' ? 'active' : ''}`}
              onClick={() => setActiveTab('swipe')}
            >
              <span>🔥 Descoberta</span>
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
              onClick={() => setActiveTab('matches')}
            >
              <span>❤️ Matches</span>
              {session.likedPlaces.length > 0 && (
                <span className="nav-badge-count">{session.likedPlaces.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`}
              onClick={() => setActiveTab('itinerary')}
            >
              <span>🗺️ Roteiro Inteligente</span>
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
              onClick={() => setActiveTab('weather')}
            >
              <span>☀️ Previsão 7 Dias</span>
            </button>
          </nav>
        </div>

        {/* Hero Weather Banner */}
        {ranking && topForecast && (
          <section className="weather-hero-banner" aria-label="Resumo do Destino">
            <div className="hero-location-info">
              <h2>{ranking.locationName}</h2>
              <p>
                Viabilidade para <strong>{ranking.activity}</strong>:{' '}
                <span className={`suitability-badge ${topForecast.suitability}`}>
                  {topForecast.suitability} ({topForecast.score}/100)
                </span>
              </p>
            </div>
            <div className="hero-weather-metrics">
              <div className="metric-pill">
                <span className="label">Temperatura</span>
                <span className="value">
                  {Math.round(topForecast.metrics.tempMin)}°C ~ {Math.round(topForecast.metrics.tempMax)}°C
                </span>
              </div>
              <div className="metric-pill">
                <span className="label">Chuva</span>
                <span className="value">{topForecast.metrics.precipitationProbability}%</span>
              </div>
              <div className="metric-pill">
                <span className="label">Vento</span>
                <span className="value">{Math.round(topForecast.metrics.windSpeedMax)} km/h</span>
              </div>
            </div>
          </section>
        )}

        {/* Errors / Loading Alerts */}
        {weatherError && (
          <div className="empty-deck-card" style={{ borderColor: 'rgba(225, 29, 72, 0.3)' }}>
            <h3>⚠️ Ocorreu um erro</h3>
            <p>{weatherError}</p>
          </div>
        )}

        {/* Tab 1: Swipe Discovery */}
        {activeTab === 'swipe' && (
          <div>
            {loadingPlaces ? (
              <div className="empty-deck-card">
                <div className="empty-deck-icon">⏳</div>
                <h3>Buscando atrações reais em {activeCity}...</h3>
                <p>Consultando dados georreferenciados e previsões climáticas.</p>
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
                totalLikes={session.likedPlaces.length}
              />
            )}
          </div>
        )}

        {/* Tab 2: Matches View */}
        {activeTab === 'matches' && (
          <MatchesList
            city={activeCity}
            matches={session.likedPlaces}
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
                onBackToMatches={() => setActiveTab('matches')}
              />
            ) : (
              <div className="empty-deck-card">
                <div className="empty-deck-icon">✨</div>
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
            {ranking.dailyRanking.map((day) => (
              <div key={day.date} className="match-card" style={{ padding: '1.5rem' }}>
                <span className={`suitability-badge ${day.suitability}`} style={{ alignSelf: 'flex-start', marginBottom: '0.75rem' }}>
                  {day.suitability} • {day.score}/100
                </span>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {day.verdict}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>🌡️ {Math.round(day.metrics.tempMin)}°C ~ {Math.round(day.metrics.tempMax)}°C</div>
                  <div>🌧️ {day.metrics.precipitationProbability}% chuva</div>
                  <div>💨 {Math.round(day.metrics.windSpeedMax)} km/h</div>
                  <div>☀️ UV {day.metrics.uvIndexMax}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
export default App;
